import { ComponentType } from "react";


/*registers a component with nativewind cssinterop if nativewind is installed */
export function registerInterop<T extends ComponentType<any>>(
    component:T,
    mappings:Record<string,string |{
        target:string |boolean;
        nativeStyleToProp?:Record<string,string|boolean>
    }>
):T{
    try{
        const{cssInterop}=require('nativewind');
        cssInterop(component,mappings);
    }catch(error){

    }
    return component
}