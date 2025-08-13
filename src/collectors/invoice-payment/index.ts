import "../../_.style/index.less"
import {Component, Frame, Input,Navigator,Observable} from "@hotfusion/ui";
import {ClientInformation} from "./pages/client-information";
import {PaymentGateway} from "./pages/payment-gateway";
import {Receipt} from "./pages/receipt";

interface IInterfaceSettings {
    theme: string;
}
export class Interface extends Component<any,any>{
    constructor(settings: IInterfaceSettings) {
        super(settings || {},{
            theme : 'default',
        });
    }
    async mount(frame: Frame): Promise<this> {
        let selectedIndex = 0;
        let navigator = new Navigator({
            selectedIndex : selectedIndex,
           // hideTabs   : true,
            commands   : [{
                id       : 'next',
                type     : 'button',
                label    : 'Continue',
                position : 'right-bottom',
                theme    : 'dark'
            }],
            components : [{
                id        : 'client-information-tab',
                title     : 'Invoice',
                component : new ClientInformation(this.settings),
            },{
                id        : 'payment-gateway-tab',
                title     : 'Payment',
                component : new PaymentGateway(this.settings),

            },{
                id        : 'receipt-tab',
                title     : 'Receipt',
                component : new Receipt(this.settings),
            }]
        }).on('command:click', (e) => {
            if(e.item.id === 'next' && selectedIndex < 3)
                selectedIndex++;

            navigator.updateSettings({
                selectedIndex
            });
        });

        let form
            = new Frame('form',navigator);


        this.on('settings', this.render)
        await frame.push(form);
        return super.mount(frame);
    }

    render(){
        console.log('theme',this.settings.theme);
    }
}