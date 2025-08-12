import "../../_.style/index.less"
import {Component, Frame, Input,Navigator} from "@hotfusion/ui";

interface IInterfaceSettings {
    theme: string;
}
export class Interface extends Component<any,any>{

    constructor(settings: IInterfaceSettings) {
        super(settings || {},{
            theme: 'default',
        });
    }

    async mount(frame: Frame): Promise<this> {
        let navigator = new Navigator({
            hideTabs   : true,
            components : []
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