package sketchobj.stmts;


import java.util.Map;

import constraintfactory.ConstData;
import sketchobj.core.Context;
import sketchobj.core.SketchObject;
import sketchobj.core.Type;

public abstract class Statement extends SketchObject{

	private int lineNumber;
	private boolean sorceCode;
	private Context postctx;
	private Context prectx;
	
	public int size() {
		// TODO Auto-generated method stub
		return 0;
	}

	public int getLineNumber() {
		return lineNumber;
	}

	public void setLineNumber(int lineNumber) {
		this.lineNumber = lineNumber;
	}
	
	public boolean isSorce(){
		return this.sorceCode;
	}
	
	public abstract ConstData replaceConst(int index);

	public Context getPostctx() {
		return postctx;
	}

	public void setPostctx(Context ctx) {
		this.postctx = ctx;
	}
	
	public abstract Context buildContext(Context prectx);
	
	public abstract Map<String,Type> addRecordStmt(StmtBlock parent, int index, Map<String,Type> m);

	public Context getPrectx() {
		return prectx;
	}

	public void setPrectx(Context prectx) {
		this.prectx = prectx;
	}
}
