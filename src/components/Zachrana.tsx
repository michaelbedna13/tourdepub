import { Component, type ErrorInfo, type ReactNode } from "react";

/** Poslední záchrana: když se cokoli rozsype, ať tam není černá plocha bez
 *  vysvětlení. V hospodě po pár pivech je hláška s tlačítkem k nezaplacení. */
export class Zachrana extends Component<{ children: ReactNode }, { chyba: Error | null }> {
  state = { chyba: null as Error | null };

  static getDerivedStateFromError(chyba: Error) {
    return { chyba };
  }

  componentDidCatch(chyba: Error, kde: ErrorInfo) {
    console.error("Appka se zasekla:", chyba, kde.componentStack);
  }

  render() {
    if (!this.state.chyba) return this.props.children;
    return (
      <div className="app">
        <div className="obrazovka">
          <div className="prazdno">
            <p style={{ marginBottom: 6 }}>Appka se zasekla.</p>
            <p className="drobne">{this.state.chyba.message}</p>
            <button className="tl hlavni" style={{ marginTop: 18 }} onClick={() => location.reload()}>
              Načíst znovu
            </button>
          </div>
        </div>
      </div>
    );
  }
}
