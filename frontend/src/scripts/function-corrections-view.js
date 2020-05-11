import { htmlBuilder } from './util';
import DebugTab from './debug-tab';

class FunctionCorrectionView extends DebugTab {

  constructor (wrapperElem) {
    // Call EventHandler initialization code
    super();
    this.wrapperElem = wrapperElem

  }

  setTrace(traceData) {
  }
}

export default FunctionCorrectionView
