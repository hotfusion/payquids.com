import "../../_.style/index.less"
import {Component, Frame, Input,Navigator,Observable} from "@hotfusion/ui";
import {ClientInformation} from "./pages/client-information";
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
        let navigator = new Navigator({
            hideTabs   : true,
            components : [{
                id        : 'client-information-tab',
                title     : 'client Information',
                component : new ClientInformation(this.settings),
            }]
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