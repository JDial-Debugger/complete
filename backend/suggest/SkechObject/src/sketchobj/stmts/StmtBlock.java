package sketchobj.stmts;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import constraintfactory.ConstData;
import sketchobj.core.Context;
import sketchobj.core.Type;

public class StmtBlock extends Statement {

	public List<Statement> stmts;

	public StmtBlock(List<? extends Statement> stmts) {
		this.stmts = Collections.unmodifiableList(stmts);
	}

	public StmtBlock() {
		this.stmts = new ArrayList<Statement>();
	}

	/** Create a new StmtBlock for a pair of statements. */
	public StmtBlock(Statement stmt1, Statement stmt2) {
		List<Statement> lst = new ArrayList<Statement>(2);
		lst.add(stmt1);
		lst.add(stmt2);
		this.stmts = Collections.unmodifiableList(lst);
	}

	public void addStmt(Statement stmt) {
		this.stmts.add(stmt);
	}

	public String toString() {
		String result = "";
		Iterator<Statement> it = stmts.iterator();
		while (it.hasNext()) {
			result += it.next().toString() + "\n";
		}
		return result;
	}

	public boolean isBlock() {
		return true;
	}

	/** Returns the list of statements of this. */
	public List<Statement> getStmts() {
		return stmts;
	}

	@Override
	public int size() {
		int sz = 0;
		if (stmts != null) {
			for (Statement s : stmts) {
				sz += s.size();
			}
		}
		return sz;
	}

	@Override
	public ConstData replaceConst(int index) {
		return new ConstData(null, stmts, index, 0,null, this.getLineNumber());
	}

	@Override
	public Context buildContext(Context prectx) {
		prectx = new Context(prectx);
		Context postctx = new Context(prectx);
		for (int i = 1; i < this.stmts.size(); i++) {
			postctx = stmts.get(i - 1).buildContext(postctx);
		}
		postctx = this.stmts.get(this.stmts.size()-1).buildContext(postctx);

		this.setPostctx(new Context(postctx));
		this.setPrectx(prectx);
		return postctx;
	}

	@Override
	public Map<String, Type> addRecordStmt(StmtBlock parent, int index, Map<String, Type> m) {
		for (int i = 0; i < stmts.size(); i++) {
			m.putAll(stmts.get(i).addRecordStmt(this, i, m));
		}
		return m;
	}
}
