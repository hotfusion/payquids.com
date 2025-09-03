import "../../_.style/index.less"
import {Component, Frame, Input,Navigator,Observable} from "@hotfusion/ui";
import {ClientInformation} from "./pages/client-information";
import {ProcessorGateway} from "./pages/processor-gateway";
import {Receipt} from "./pages/receipt";
import {Connector} from "../../../../../workspace/src/_.manager/src/_.utils/client-connector"
interface IInterfaceSettings {
    theme: string;
    connector : Connector
}
export class Interface extends Component<any,any>{

    constructor(settings: IInterfaceSettings) {
        super(settings || {},{
            theme : 'default',
        });
    }

    async mount(frame: Frame): Promise<this> {

        let selectedIndex   = 0,
            gateway = new ProcessorGateway(this.getSettings());

        let navigator = new Navigator({
            selectedIndex : 2,//selectedIndex,
            theme      : 'dark',
            stretch    : true,
            commands   : [{
                id       : 'next',
                type     : 'button',
                label    : 'Continue',
                position : 'right-bottom',
                theme    : 'dark',
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
                component : new ClientInformation(this.getSettings()),
            },{
                id        : 'payment-gateway-tab',
                title     : 'Payment',
                disabled  : true,
                icon : {
                    code : 'keyboard_double_arrow_right'
                },
                align     : 'center',
                component : gateway,

            },{
                id        : 'receipt-tab',
                title     : 'Receipt',
                disabled  : true,
                icon : {
                    code : 'keyboard_double_arrow_right'
                },
                align     : 'center',
                component : new Receipt(this.getSettings()),
            }]
        }).on('command:click', async (e) => {

            let goBackButtonFrame:Frame   = e.toolbar.frame.blocks[0].blocks[0];
            let continueButtonFrame:Frame = e.toolbar.frame.blocks[1].blocks[0];

            if(e.item.id === 'back' && selectedIndex > 0)
                selectedIndex--;

            if(e.item.id === 'next' && selectedIndex < 2) {
                continueButtonFrame.setBusy(true);
                selectedIndex++;
            }

            if(selectedIndex === 1){
                continueButtonFrame.setDisabled(true)
                let {output:{client_secret}} = await Connector.getRoutes().gateway.intent({
                    "domain"   : "businessmediagroup.us",
                    "amount"   : 10,
                    "email"    : "korolov.vadim@gmail.com",
                    "name"     : "Korolov Vadim",
                    "phone"    : "5149996659",
                    "address"  : "375 marcel laurin",
                    "currency" : "usd",
                    "scope"    : "invoice",
                    "mode"     : "development"
                })
                await gateway.initiate({
                    client_secret, public_key : 'pk_test_51OjSyyD2mFbJWRwtvCs5J5jtZ4SzCl9DXwrbOV4w7rqyyfGEcudlLIVtp1bNMcP0WhSE71RItgZUVBIeIUGpjtE000NacufrOM'
                })
                gateway.on('change', async ({complete}) => {
                    continueButtonFrame.setDisabled(!complete);
                })
            }
            navigator.updateSettings({
                selectedIndex
            });

            goBackButtonFrame.setDisabled(selectedIndex === 0);
            continueButtonFrame.setBusy(false);
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