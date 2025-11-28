import {ClientInformation} from "./pages/client-information";
import {Paypal,Stripe} from "./pages/processor-gateway";
import {Receipt} from "./pages/receipt";
import {Browser} from "@hotfusion/ui";
//@ts-ignore
import {Connector} from "@hotfusion/ws/client/index.esm.js";
import {Button, Component, Frame, Navigator, Utils, Dialog} from "@hotfusion/ui";
import {XBranchMeta} from "../../index.schema";

interface IInterfaceSettings {
    theme     : string;
    domain    : string;
    connector : Connector
    invoice   : string;
    amount    : number;
    currency  : 'USD' | 'CAD'
    receipt   : {
        amount : number;
        customer : IInterfaceSettings['client']
    }
    client   ?: Partial<{
        name    : string;
        email   : string;
        phone   : string;
    }>
}

interface XProcessor {orderID:string,provider:string,type:string,keys:{public:string},_gid:string}


export class Application extends Component<any,any>{
    customer:{name:string,email:string,phone:string}

    amount:number
    invoice:string
    constructor(settings: IInterfaceSettings) {
        super(settings || {},{
            theme    : 'default',
            domain   : '',
            client   : false,
            amount   : 0,
            invoice  : false,
            receipt  : false,
            currency : 'USD'
        });
    }
    async mount(frame: Frame) : Promise<this> {
        let meta = (await Connector.getRoutes().meta({
            domain : this.getSettings().domain
        })).output;

        let goBackButtonFrame:Frame,
            continueButtonFrame:Frame,
            clientInformationTab:Frame,
            paymentGatewayTab:Frame,
            receiptTab:Frame

        // let branch:XBranchMeta = Utils.decodeJwt(meta);

        let selectedIndex = 0;

        if(this.getSettings().receipt.amount) {
            (<any>window)._receipt = this.getSettings().receipt;
            selectedIndex = 2;
        }

        let completionMode = () => {
            let paymentGatewayTab         = navigator.getFrame().findBlockById('tab:payment-gateway-tab');
            let receiptTab                = navigator.getFrame().findBlockById('tab:receipt-tab');
            let goBackButtonFrame:Frame   = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[0].getBlocks()[0];
            let continueButtonFrame:Frame = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];


            continueButtonFrame.setBusy(true);
            continueButtonFrame.getComponent<Button>().updateSettings({
                disabled : false,
                label    : `Return to ${this.getSettings().domain}`
            });

            goBackButtonFrame.setVisible(Browser.isMobile());
            goBackButtonFrame.setDisabled(true);
            paymentGatewayTab.setDisabled(false);
            receiptTab.setDisabled(false);

            setTimeout(() => {
                continueButtonFrame.setBusy(false);
               // Receipt.mount(charge,this.card,this.customer);
            },500)
        }

        let navigator = new Navigator({
            selectedIndex : selectedIndex,
            theme      : 'dark',
            stretch    : true,
            commands   : [{
                id       : 'next',
                type     : 'button',
                label    : 'Continue',
                position : 'right-bottom',
                highlight : Browser.isMobile(),
                theme    : 'dark',
                disabled : true,
                icon     : Browser.isMobile()?false:{
                    class : 'ri-arrow-drop-right-line',
                    position : 'right'
                }
            },{
                id       : 'back',
                type     : 'button',
                label    : 'Go Back',
                position : 'left-bottom',
                theme    : 'dark',
                disabled : true
            }],
            components : [{
                id        : 'client-information-tab',
                title     : 'Invoice',
                align     : 'center',
                icon : {
                  class : 'ri-arrow-drop-right-line'
                },
                component : () => new ClientInformation(this.getSettings() as any ).on("change", ({complete,customer,amount,invoice}) => {
                    this.amount    = amount;
                    this.invoice   = invoice
                    this.customer  = customer;
                    paymentGatewayTab.setDisabled(!complete);
                    continueButtonFrame.setDisabled(!complete);
                }),
            },{
                id        : 'payment-gateway-tab',
                title     : 'Payment',
                disabled  : true,
                icon : {
                    class : 'ri-arrow-drop-right-line'
                },
                align     : 'center',
                component : () =>  new Component({},{}).on('mounted', async (component:Component) => {

                    component.getFrame().findBlockById('gateway-frame')?.remove?.();
                    component.getFrame().findBlockById('hosted-frame')?.remove?.();
                    component.getFrame().findBlockById('loading-frame')?.remove?.();

                    let GatewayFrame = new Frame('gateway-frame').setSize(400).setOrientation('horizontal');
                    let HostedFrame  = new Frame('hosted-frame').setSize(100).setStyle({'align-items':'end'});
                    let LoadingFrame = new Frame('loading-frame').unstack(true);

                    let providers = {
                        paypal : Paypal,
                        stripe : Stripe
                    }

                    try{
                        let Intent:{id:string,processors:XProcessor[]} = (await Connector.getRoutes().intent({
                            domain   : this.getSettings().domain,
                            currency : this.getSettings().currency,
                            amount   : this.amount,
                            invoice  : this.invoice,
                            customer : this.customer
                        })).output;

                        let MountHostedProcessor = async (type:string,processors:XProcessor[],button?:Frame) => {
                            for (let i = 0; i < processors.length; i++)
                                if(processors[i].type === type)
                                    (await new providers[processors[i].provider](
                                        processors[i].orderID,
                                        processors[i].keys,
                                        processors[i].type,
                                        [],
                                        this.getSettings().currency
                                    ).mount(
                                         (type === 'gateway'?GatewayFrame:HostedFrame).getTag(),button
                                    )).on('complete', async ({id}) => {
                                         let {output:{receipt}} = await Connector.getRoutes().charge({
                                             _pid  : id,
                                             _iid  : Intent.id,
                                             _gid  : processors[i]._gid
                                         });

                                        component.emit('complete',{receipt});
                                    }).on('error', async ({message}) => {
                                        continueButtonFrame.setBusy(false).setAttribute('type','exception');
                                        goBackButtonFrame.setDisabled(false);

                                        let button = continueButtonFrame.getComponent<Button>()
                                            button.updateSettings({
                                                label     : 'Try Again!',
                                                disabled  : false
                                            });
                                            await button.render();

                                        await Dialog.exception('Credit Card Denied',message);
                                    })
                        }

                        GatewayFrame.on('mounted', async (frame:Frame) => {
                            await MountHostedProcessor('gateway',Intent.processors,continueButtonFrame);

                            if(HostedFrame.isMounted())
                                 await MountHostedProcessor('hosted',Intent.processors);
                            else
                                await new Promise(resolve => {
                                    HostedFrame.on('mounted', async () => resolve(await MountHostedProcessor('hosted',Intent.processors)))
                                })

                            continueButtonFrame.setBusy(false)
                            goBackButtonFrame.setVisible(true);
                            setTimeout(() => {
                                LoadingFrame.remove();
                            })
                        });

                        await component
                            .getFrame()
                            .setOrientation('horizontal')
                            .push(LoadingFrame,GatewayFrame,HostedFrame);

                    }catch ({output}){
                        console.log(output.output)
                    }

                }).on('change', ({complete}) => {
                    let continueButtonFrame:Frame
                        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

                    continueButtonFrame.setDisabled(!complete)

                }).on('complete',async ({receipt}) => {
                    (<any>window)._receipt = receipt;
                    let button = continueButtonFrame.getComponent<Button>()
                        button.updateSettings({
                            label     : 'Go Back to Merchant',
                            disabled  : false
                        });
                        await button.render();

                    //
                    clientInformationTab
                        .setDisabled(false).setAttribute('completed', 'true');
                    paymentGatewayTab
                        .setDisabled(false).setAttribute('completed', 'true');
                    receiptTab
                        .setDisabled(false).setAttribute('completed', 'true');

                    selectedIndex = 2;
                    navigator.updateSettings({selectedIndex:2});

                    continueButtonFrame.setBusy(false);
                })

            },{
                id        : 'receipt-tab',
                title     : 'Receipt',
                disabled  : true,
                icon : {
                    class : 'ri-arrow-drop-right-line'
                },
                align     : 'center',
                component : () => {
                    //console.log('this.receipt:',receipt)
                    return new Receipt((<any>window)._receipt  as any).on('mounted',completionMode)
                },
            }]
        }).on('command:click', async (e) => {
            // SET BUSY IF NEXT CLICKED
            if(e.item.id === 'next')
               continueButtonFrame.setBusy(true);

            // REDUCE INDEX IF LARGER THAN 0 AND ITEM CLICKED IS BACK
            if(e.item.id === 'back' && selectedIndex > 0)
                selectedIndex--;
            // INCREASE INDEX IF LESS THAN 0 AND ITEM CLICKED IS NEXT
            if(e.item.id === 'next' && selectedIndex < 2)
                selectedIndex++;


            // DISABLE BACK BUTTON IS INDEX IS 0 OR 2
            goBackButtonFrame
                .setDisabled(selectedIndex === 0 || selectedIndex === 2)

            if(selectedIndex === 0){
                clientInformationTab
                    .setDisabled(false).setAttribute('completed', 'false');
                paymentGatewayTab
                    .setDisabled(true).setAttribute('completed', 'false');
                receiptTab
                    .setDisabled(true).setAttribute('completed', 'false');

                goBackButtonFrame
                    .setVisible(Browser.isMobile());
                continueButtonFrame
                    .setDisabled(true);
            }

            if(selectedIndex === 1){
                clientInformationTab
                    .setDisabled(false).setAttribute('completed', 'true');
                paymentGatewayTab
                    .setDisabled(false).setAttribute('completed', 'false');
                receiptTab
                    .setDisabled(true).setAttribute('completed', 'false');
            }

            if(selectedIndex === 2){
                clientInformationTab
                    .setDisabled(false).setAttribute('completed', 'true');
                paymentGatewayTab
                    .setDisabled(false).setAttribute('completed', 'true');
                receiptTab
                    .setDisabled(false).setAttribute('completed', 'true');

                continueButtonFrame
                    .setDisabled(true);
            }

            if(selectedIndex < 2 || e.item.id === 'back')
               navigator.updateSettings({selectedIndex});

        }).on('mounted',() => {
            // BUTTONS
            goBackButtonFrame
                = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[0].getBlocks()[0];

            continueButtonFrame
                = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

            // TABS
             clientInformationTab
                = navigator.getFrame().findBlockById('tab:client-information-tab');

             paymentGatewayTab
                = navigator.getFrame().findBlockById('tab:payment-gateway-tab');

             receiptTab
                = navigator.getFrame().findBlockById('tab:receipt-tab');

            clientInformationTab.setDisabled(false);
            paymentGatewayTab.setDisabled(true);
            receiptTab.setDisabled(true);
            goBackButtonFrame.setVisible(Browser.isMobile());
        })



        let form
            = new Frame('form',navigator);

        this.on('settings', this.render)
        await frame.push(form);
        return super.mount(frame);
    }
    render(){
        console.log('theme',this.getSettings().theme);
    }
}