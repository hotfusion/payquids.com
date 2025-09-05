import "../../_.style/index.less"
import {Button, Component, Frame, Input, Navigator, Observable} from "@hotfusion/ui";
import {ClientInformation} from "./pages/client-information";
import {ProcessorGateway} from "./pages/processor-gateway";
import {Receipt} from "./pages/receipt";
import {Connector} from "../../../../../workspace/src/_.manager/src/_.utils/client-connector"
interface IInterfaceSettings {
    theme     : string;
    domain    : string;
    connector : Connector
    client   ?: Partial<{
        name    : string;
        email   : string;
        phone   : string;
        invoice : string;
        amount  : number;
    }>
}
export class Interface extends Component<any,any>{

    constructor(settings: IInterfaceSettings) {
        super(settings || {},{
            theme  : 'default',
            domain : '',
            client : false
        });
    }


    async mount(frame: Frame): Promise<this> {


        let branch = (await Connector.getRoutes().branch.metadata({
            domain : this.getSettings().domain
        })).output;

        let selectedIndex= 0,charge:{amount:0, currency:'USD'};

        let Client:{name:string,email:string,amount:number,invoice:string,phone:string}

        let completionMode = () => {
            let paymentGatewayTab    = navigator.getFrame().findBlockById('tab:payment-gateway-tab');
            let receiptTab           = navigator.getFrame().findBlockById('tab:receipt-tab');
            let goBackButtonFrame:Frame          = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[0].getBlocks()[0];
            let continueButtonFrame:Frame        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

            continueButtonFrame.setBusy(true)
            continueButtonFrame.getComponent<Button>().updateSettings({
                disabled : false,
                label    : `Return to ${this.getSettings().domain}`
            })

            goBackButtonFrame.setVisible(false)
            paymentGatewayTab.setDisabled(false)
            receiptTab.setDisabled(false)

            setTimeout(() => {
                continueButtonFrame.setBusy(false);
                Receipt.mount(charge)
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
                    code : 'keyboard_double_arrow_right'
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
                  code : 'keyboard_double_arrow_right'
                },
                component : () => new ClientInformation(this.getSettings()).on("change", ({complete,client}) => {
                    let continueButtonFrame:Frame
                        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

                    let paymentGatewayTab
                        = navigator.getFrame().findBlockById('tab:payment-gateway-tab');

                    Client = client;
                    paymentGatewayTab.setDisabled(!complete)
                    continueButtonFrame.setDisabled(!complete)

                }),
            },{
                id        : 'payment-gateway-tab',
                title     : 'Payment',
                disabled  : true,
                icon : {
                    code : 'keyboard_double_arrow_right'
                },
                align     : 'center',
                component : () =>  new ProcessorGateway(this.getSettings()).on('mounted', async (com) => {
                    let {output:{client_secret}} = await Connector.getRoutes().gateway.intent({
                        "domain"   : this.getSettings().domain,
                        "amount"   : Client.amount,
                        "email"    : Client.email,
                        "name"     : Client.name,
                        "phone"    : Client.phone,
                        "mode"     : branch.mode,
                        "currency" : "usd",
                        "scope"    : "invoice",
                    }),public_key = branch.keys.public;

                    await com.init(public_key, client_secret);

                    let continueButtonFrame:Frame
                        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];

                    continueButtonFrame.setBusy(false).getComponent<any>().on('click',async () => {
                        continueButtonFrame.setBusy(true);

                        let { amount, error }  = charge = await com.charge()

                        if(!error){
                            selectedIndex++;
                            navigator.updateSettings({
                                selectedIndex
                            });
                        }
                    });

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
                    code : 'keyboard_double_arrow_right'
                },
                align     : 'center',
                component : () => new Receipt(this.getSettings()).on('mounted',() => {
                    if(selectedIndex === 2) {
                        completionMode()
                    }
                }),
            }]
        }).on('command:click', async (e) => {

            if(selectedIndex === 1)
                return;

            let goBackButtonFrame:Frame          = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[0].getBlocks()[0];
            let continueButtonFrame:Frame        = navigator.getFrame().findBlockById('command-footer-bar').getBlocks()[1].getBlocks()[0];
            let paymentGatewayTab    = navigator.getFrame().findBlockById('tab:payment-gateway-tab');

            if(e.item.id === 'next')
               continueButtonFrame.setBusy(true);

            if(e.item.id === 'back' && selectedIndex > 0)
                selectedIndex--;

            if(e.item.id === 'next' && selectedIndex < 2) {
                selectedIndex++;
            }
            goBackButtonFrame.setDisabled(selectedIndex === 0)

            if(selectedIndex === 1){
                paymentGatewayTab.setDisabled(false)
                continueButtonFrame.setDisabled(true)
            }

            navigator.updateSettings({
                selectedIndex
            });

        }).on('index:changed', ({index}) => {
            selectedIndex = index;
        });

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