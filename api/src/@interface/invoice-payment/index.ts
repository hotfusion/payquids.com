import {ClientInformation} from "./pages/client-information";
import {ProcessorGateway} from "./pages/processor-gateway";
import {Receipt} from "./pages/receipt";
//@ts-ignore
import {Connector} from "@hotfusion/ws/client/index.esm.js";
import {Button, Component, Frame, Navigator, Utils} from "@hotfusion/ui";

interface IInterfaceSettings {
    theme     : string;
    domain    : string;
    connector : Connector
    invoice   : string;
    amount    : number;
    client   ?: Partial<{
        name    : string;
        email   : string;
        phone   : string;
    }>
}
export class Application extends Component<any,any>{
    customer:{name:string,email:string,amount:number,invoice:string,phone:string}
    card:any
    constructor(settings: IInterfaceSettings) {
        super(settings || {},{
            theme  : 'default',
            domain : '',
            client : false,
            amount : 0,
            invoice : false
        });
    }
    async mount(frame: Frame) : Promise<this> {
        let session = (await Connector.getRoutes().gateway.metadata({
            domain : this.getSettings().domain
        })).output;

        let goBackButtonFrame:Frame,continueButtonFrame:Frame,clientInformationTab:Frame,paymentGatewayTab:Frame,receiptTab:Frame

        let branch
            = Utils.decodeJwt(session);

        console.log('branch:',branch);
        let selectedIndex = 0,
            charge:{amount:0, currency:'USD'};

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

            goBackButtonFrame.setVisible(false);
            paymentGatewayTab.setDisabled(false);
            receiptTab.setDisabled(false);

            setTimeout(() => {
                continueButtonFrame.setBusy(false);
                Receipt.mount(charge,this.card,this.customer);
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
                theme    : 'dark',
                disabled : true,
                icon     : {
                    class : 'ri-arrow-drop-right-line',
                    position : 'right'
                }
            },{
                id       : 'back',
                type     : 'button',
                label    : 'Return',
                position : 'left-bottom',
                theme    : 'dark',
                disabled : true,
                icon     : {
                    class : 'ri-arrow-drop-left-line',
                    position : 'left'
                }
            }],
            components : [{
                id        : 'client-information-tab',
                title     : 'Invoice',
                align     : 'center',
                icon : {
                  class : 'ri-arrow-drop-right-line'
                },
                component : () => new ClientInformation(this.getSettings() as any ).on("change", ({complete,client}) => {
                    let continueButtonFrame:Frame
                        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

                    let paymentGatewayTab
                        = navigator.getFrame().findBlockById('tab:payment-gateway-tab');

                    this.customer = client;
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
                component : () =>  new ProcessorGateway( this.getSettings() as any, branch).on('mounted', async (com) => {

                    let { output : { client_secret } } = await Connector.getRoutes().gateway.intent({
                        "domain"   : this.getSettings().domain,
                        "amount"   : this.customer.amount,
                        "email"    : this.customer.email,
                        "name"     : this.customer.name,
                        "phone"    : this.customer.phone,
                        "mode"     : branch.mode,
                        "currency" : "usd",
                        "scope"    : "invoice",
                    });

                    await com.init(branch.keys.public, client_secret);

                    let continueButtonFrame:Frame
                        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

                    continueButtonFrame.setBusy(false).getComponent<any>().on('click',async () => {
                        continueButtonFrame.setBusy(true);

                        let { error,intent }  = charge = await com.charge()

                        if(!error){
                            let charge = await Connector.getRoutes().gateway.charge({
                                domain : this.getSettings().domain,
                                id     : intent.id
                            });

                            if(charge.output.completed)
                                this.card = charge.output.card

                            clientInformationTab
                                .setDisabled(false).setAttribute('completed', 'true');
                            paymentGatewayTab
                                .setDisabled(false).setAttribute('completed', 'true');
                            receiptTab
                                .setDisabled(false).setAttribute('completed', 'true');

                            selectedIndex = 2;
                            navigator.updateSettings({selectedIndex:2});
                        }

                        continueButtonFrame.setBusy(false);
                    });
                    goBackButtonFrame.setVisible(true);

                }).on('change', ({complete}) => {
                    let continueButtonFrame:Frame
                        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

                    continueButtonFrame.setDisabled(!complete)
                }),

            },{
                id        : 'receipt-tab',
                title     : 'Receipt',
                disabled  : true,
                icon : {
                    class : 'ri-arrow-drop-right-line'
                },
                align     : 'center',
                component : () => new Receipt(this.getSettings() as any).on('mounted',completionMode),
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
                    .setVisible(false);
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

        }).on('index:changed', ({index}) => {
            //selectedIndex = index;
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
            goBackButtonFrame.setVisible(false);
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