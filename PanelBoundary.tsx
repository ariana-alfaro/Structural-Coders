import {Component,type ReactNode} from 'react';
export class PanelBoundary extends Component<{children:ReactNode;onBack:()=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(error:Error){console.error('No se pudo mostrar el panel:',error)}
 render(){return this.state.failed?<section className="teacherresults" role="alert"><h2>No se pudo abrir esta sección</h2><p>Tus cuestionarios siguen guardados. Puedes volver al panel e intentarlo otra vez.</p><button className="primary" onClick={this.props.onBack}>Volver a mis cuestionarios</button></section>:this.props.children}
}
