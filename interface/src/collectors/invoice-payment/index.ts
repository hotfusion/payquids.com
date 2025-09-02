import "../../_.style/index.less"
import {Component, Frame, Input,Navigator,Observable} from "@hotfusion/ui";
import {ClientInformation} from "./pages/client-information";
import {ProcessorGateway} from "./pages/processor-gateway";
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
            theme      : 'dark',
            stretch    : true,
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
                component : new ProcessorGateway(this.getSettings()),

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
        }).on('command:click', (e) => {
            if(e.item.id === 'next' && selectedIndex < 2)
                selectedIndex++;

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