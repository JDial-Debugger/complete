package constraintfactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Stack;

import jsonast.Trace;
import jsonast.Traces;
import sketchobj.core.*;
import sketchobj.core.Function.FcnType;
import sketchobj.expr.*;
import sketchobj.stmts.*;

public class ConstraintFactory {
	// TODO: repair arrayInit.replaceConst(), else statement, Expr.field, all
	// varDecl should be init now
	static int constNumber = 0;
	static Map<String, Set<Integer>> constMap = new HashMap<String, Set<Integer>>();
	static List<String> varList = new ArrayList<String>();

	static Map<Integer, Integer> constMapLine = new HashMap<Integer, Integer>();

	static Traces oriTrace;
	static Trace finalState;
	// static int finalCount;
	static FcnHeader fh;
	static int hitline = 0;
	static int hitnumber = 0;
	static int length = 5;
	static int originalLength = 5;
	static List<Expression> args = new ArrayList<>();

	// configurations
	static boolean is_linearcombination = false;
	static int distance_type = 0;
	static int numberOfChange = 1;

	// specified range
	static boolean limited_range = false;
	static List<Integer> repair_range = null;

	public static List<ExternalFunction> externalFuncs = new ArrayList<ExternalFunction>();

	// ------------ Construct method
	public ConstraintFactory(Traces oriTrace, Trace finalState, FcnHeader fh, List<Expression> args) {
		ConstraintFactory.fh = fh;
		ConstraintFactory.oriTrace = oriTrace;
		ConstraintFactory.finalState = finalState;
		ConstraintFactory.hitline = finalState.getLine();
		hitnumber = 0;
		for (int i = 0; i < oriTrace.getLength(); i++) {
			if (oriTrace.getTraces().get(i).getLine() == ConstraintFactory.hitline) {
				hitnumber++;
			}
		}
		originalLength = oriTrace.getLength();
		length = originalLength * 2;

		constMap = new HashMap<String, Set<Integer>>();
		varList = new ArrayList<String>();

		this.args = args;

	}

	public ConstraintFactory(Traces oriTrace, Trace finalState, FcnHeader fh) {
		this(oriTrace, finalState, fh, new ArrayList<Expression>());
		// this.args = args;
	}

	public ConstraintFactory(Traces oriTrace, Trace finalState, FcnHeader fh, Expression parameter) {
		this(oriTrace, finalState, fh);
		List<Expression> l = new ArrayList<Expression>();
		l.add(parameter);
		// this.args = l;
	}

	// set allowed ranges
	public void setRange(List<Integer> l) {
		ConstraintFactory.limited_range = true;
		ConstraintFactory.repair_range = l;
	}

	// ------------ main function, generate Sketch script for code <source>
	public String getScript(Statement source) {

		Statement s = source;
		Statement constFunDecls = null;

		// extract info of external functions
		externalFuncs = s.extractExternalFuncs(externalFuncs);
		if (externalFuncs.size() > 0)
			System.out.println(externalFuncs.get(0).getName_Java());

		buildContext((StmtBlock) source);
		// replace all constants in source code
		if (!ConstraintFactory.limited_range) {
			// s.replaceLinearCombination();
			constFunDecls = ConstraintFactory.replaceConst(s);
		} else {
			// s.replaceLinearCombination(ConstraintFactory.repair_range);
			constFunDecls = ConstraintFactory.replaceConst(s);
		}

		// add record stmts to source code and collect vars info
		Map<String, Type> vars = ConstraintFactory.addRecordStmt((StmtBlock) s);
		List<String> varsNames = new ArrayList<String>(vars.keySet());
		varList = varsNames;
		List<Type> varsTypes = new ArrayList<Type>();
		for (int i = 0; i < varsNames.size(); i++) {
			varsTypes.add(vars.get(varsNames.get(i)));
		}

		// add declare of <linehit> and <count>
		s = new StmtBlock(new StmtVarDecl(new TypePrimitive(4), "linehit", new ExprConstInt(0), 0), s);
		s = new StmtBlock(new StmtVarDecl(new TypePrimitive(4), "count", new ExprConstInt(-1), 0), s);

		Function f = new Function(ConstraintFactory.fh, s);

		List<Statement> stmts = new ArrayList<>();

		// add declare of const functions
		stmts.add(constFunDecls);

		// add line array
		stmts.add(
				new StmtBlock(varArrayDecl("line", length, new TypePrimitive(4)), varArrayDecls(varsNames, varsTypes)));

		// add final state
		// System.out.println(finalState.getOrdered_locals().size());
		for (String v : finalState.getOrdered_locals()) {
			stmts.add(new StmtVarDecl(new TypePrimitive(4), v + "final", new ExprConstInt(0), 0));
		}

		// add final count
		stmts.add(new StmtVarDecl(new TypePrimitive(4), "finalcount", new ExprConstInt(0), 0));

		Statement block = new StmtBlock(stmts);

		return block.toString() + "\n" + f.toString() + "\n" + constraintFunction().toString();
	}

	// ------------ main function, generate Sketch script for code <source>
	public String getScript_linearCombination(Statement source) {

		Statement s = source;
		Statement coeffFunDecls = null;

		// extract info of external functions
		externalFuncs = s.extractExternalFuncs(externalFuncs);
		if (externalFuncs.size() > 0)
			System.out.println(externalFuncs.get(0).getName_Java());

		buildContext((StmtBlock) source);
		// replace all constants in source code
		if (!ConstraintFactory.limited_range) {
			coeffFunDecls = ConstraintFactory.replaceLinearCombination(s);
			// constFunDecls = ConstraintFactory.replaceConst(s);
		} else {
			coeffFunDecls = ConstraintFactory.replaceLinearCombination(s, ConstraintFactory.repair_range);
			// constFunDecls = ConstraintFactory.replaceConst(s);
		}

		System.out.println(coeffFunDecls);
		// add record stmts to source code and collect vars info
		Map<String, Type> vars = ConstraintFactory.addRecordStmt((StmtBlock) s);
		List<String> varsNames = new ArrayList<String>(vars.keySet());
		varList = varsNames;
		List<Type> varsTypes = new ArrayList<Type>();
		for (int i = 0; i < varsNames.size(); i++) {
			varsTypes.add(vars.get(varsNames.get(i)));
		}

		// add declare of <linehit> and <count>
		s = new StmtBlock(new StmtVarDecl(new TypePrimitive(4), "linehit", new ExprConstInt(0), 0), s);
		s = new StmtBlock(new StmtVarDecl(new TypePrimitive(4), "count", new ExprConstInt(-1), 0), s);

		Function f = new Function(ConstraintFactory.fh, s);

		List<Statement> stmts = new ArrayList<>();

		// add declare of const functions
		stmts.add(coeffFunDecls);

		// add line array
		stmts.add(
				new StmtBlock(varArrayDecl("line", length, new TypePrimitive(4)), varArrayDecls(varsNames, varsTypes)));

		// add final state
		// System.out.println(finalState.getOrdered_locals().size());
		for (String v : finalState.getOrdered_locals()) {
			stmts.add(new StmtVarDecl(new TypePrimitive(4), v + "final", new ExprConstInt(0), 0));
		}

		// add final count
		stmts.add(new StmtVarDecl(new TypePrimitive(4), "finalcount", new ExprConstInt(0), 0));

		Statement block = new StmtBlock(stmts);

		return block.toString() + "\n" + f.toString() + "\n" + constraintFunction_linearCombination().toString();
	}

	private static Statement replaceLinearCombination(Statement s) {
		List<Statement> list = new ArrayList<Statement>();
		Stack<SketchObject> stmtStack = new Stack<SketchObject>();
		int index = 0;
		stmtStack.push(s);
		while (!stmtStack.empty()) {
			SketchObject target = stmtStack.pop();
			ConstData data = null;
			if (ConstraintFactory.limited_range) {
				data = target.replaceLinearCombination(index, ConstraintFactory.repair_range);
			} else {
				data = target.replaceLinearCombination(index);
			}
			if (data.getType() != null) {
				while (index <= data.getPrimaryCoeffIndex()) {
					list.add(coeffChangeDecl(index, new TypePrimitive(1)));
					list.add(new StmtFunDecl(addCoeffFun(index, 1, data.getType())));
					index++;
				}
				if (data.getLiveVarsIndexSet() != null) {
					for (int ii : data.getLiveVarsIndexSet()) {
						list.add(coeffChangeDecl(ii, new TypePrimitive(1)));
						list.add(new StmtFunDecl(addCoeffFun(ii, 0, data.getType())));
					}

				}
				index = data.getIndex();
				list.add(coeffChangeDecl(index - 1, new TypePrimitive(4)));
				list.add(new StmtFunDecl(addLCConstFun(index - 1, data.getType())));
			}
			index = data.getIndex();
			pushAll(stmtStack, data.getChildren());
		}
		constNumber = index;
		System.out.println(s);
		return new StmtBlock(list);
	}

	private static Function addLCConstFun(int i, Type type) {
		Expression condition_2 = new ExprStar();
		StmtReturn return_2 = new StmtReturn(new ExprConstInt(0), 0);
		StmtReturn return_3 = new StmtReturn(new ExprVar("coeff" + i + "change"), 0);

		Statement ifst_2 = new StmtIfThen(condition_2, return_2, null, 0);
		StmtBlock sb = new StmtBlock();
		sb.addStmt(ifst_2);
		sb.addStmt(return_3);
		return new Function("Coeff" + i, type, new ArrayList<Parameter>(), sb, FcnType.Static);
	}

	private static Function addCoeffFun(int index, int value, Type type) {
		Expression condition = new ExprBinary(new ExprVar("coeff" + index + "change"), "==", new ExprConstInt(0), 0);
		StmtReturn return_1 = new StmtReturn(new ExprConstInt(value), 0);
		Expression condition_2 = new ExprStar();
		StmtReturn return_2 = new StmtReturn(new ExprConstInt(1 - value), 0);
		Statement ifst = new StmtIfThen(condition, return_1, null, 0);
		Statement ifst_2 = new StmtIfThen(condition_2, return_2, null, 0);
		StmtReturn return_3 = new StmtReturn(new ExprConstInt(-1), 0);
		StmtBlock sb = new StmtBlock();
		sb.addStmt(ifst);
		sb.addStmt(ifst_2);
		sb.addStmt(return_3);
		return new Function("Coeff" + index, type, new ArrayList<Parameter>(), sb, FcnType.Static);
	}

	private static Statement coeffChangeDecl(int index, TypePrimitive typePrimitive) {
		return new StmtVarDecl(typePrimitive, "coeff" + index + "change", new ExprStar(), 0);
	}

	private static Statement replaceLinearCombination(Statement s, List<Integer> repair_range2) {
		List<Statement> list = new ArrayList<Statement>();
		Stack<SketchObject> stmtStack = new Stack<SketchObject>();
		int index = 0;
		stmtStack.push(s);
		while (!stmtStack.empty()) {
			SketchObject target = stmtStack.pop();
			ConstData data = null;
			if (ConstraintFactory.limited_range) {
				data = target.replaceLinearCombination(index, ConstraintFactory.repair_range);
			} else {
				data = target.replaceLinearCombination(index);
			}
			if (data.getType() != null) {
				while (index <= data.getPrimaryCoeffIndex()) {
					list.add(coeffChangeDecl(index, new TypePrimitive(1)));
					list.add(new StmtFunDecl(addCoeffFun(index, 1, data.getType())));
					index++;
				}
				if (data.getLiveVarsIndexSet() != null) {
					for (int ii : data.getLiveVarsIndexSet()) {
						list.add(coeffChangeDecl(ii, new TypePrimitive(1)));
						list.add(new StmtFunDecl(addCoeffFun(ii, 0, data.getType())));
					}

				}
				index = data.getIndex();
				list.add(coeffChangeDecl(index - 1, new TypePrimitive(4)));
				list.add(new StmtFunDecl(addLCConstFun(index - 1, data.getType())));
			}
			index = data.getIndex();
			pushAll(stmtStack, data.getChildren());
		}
		constNumber = index;
		System.out.println(s);
		return new StmtBlock(list);
	}

	// ------------ Auxiliary functions

	static public Statement constChangeDecl(int index, Type t) {
		return new StmtVarDecl(t, "const" + index + "change", new ExprStar(), 0);
	}

	static public Statement constChangeDecls(int number, Type t) {
		StmtBlock result = new StmtBlock();
		for (int i = 0; i < number; i++) {
			result.addStmt(new StmtVarDecl(t, "const" + i + "change", new ExprStar(), 0));
		}
		return result;
	}

	private Function constraintFunction_linearCombination() {
		List<Statement> stmts = new ArrayList<Statement>();

		int bound = (length < originalLength) ? length : originalLength;

		for (String v : varList) {
			List<Expression> arrayInit = new ArrayList<>();
			for (int i = 0; i < bound; i++) {
				if (oriTrace.getTraces().get(i).getOrdered_locals().contains(v)) {
					if (oriTrace.getTraces().get(i).getLocals().find(v).getType() == 0)
						arrayInit.add(
								new ExprConstInt((int) oriTrace.getTraces().get(i).getLocals().find(v).getValue()));
				} else {
					// TODO check if int can be null in Sketch
					arrayInit.add(new ExprConstInt(0));
				}
			}
			for (int i = bound; i < originalLength; i++) {
				arrayInit.add(new ExprConstInt(0));
			}
			stmts.add(new StmtVarDecl(new TypeArray(new TypePrimitive(4), new ExprConstInt(originalLength)),
					"oringianl" + v + "Array", new ExprArrayInit(arrayInit), 0));
		}
		List<Expression> arrayInit = new ArrayList<>();
		for (int i = 0; i < bound; i++) {
			arrayInit.add(
					new ExprConstInt((int) oriTrace.getTraces().get(i).getLine()));
		}			
		for (int i = bound; i < originalLength; i++) {
			arrayInit.add(new ExprConstInt(0));
		}
		stmts.add(new StmtVarDecl(new TypeArray(new TypePrimitive(4), new ExprConstInt(originalLength)),
				"oringianllineArray", new ExprArrayInit(arrayInit), 0));
		
		for (String v : finalState.getOrdered_locals()) {
			stmts.add(new StmtVarDecl(new TypePrimitive(4), "correctFinal_" + v,
					new ExprConstInt(finalState.getLocals().find(v).getValue()), 0));
		}

		// f(args)
		stmts.add(new StmtExpr(new ExprFunCall(fh.getName(), args, fh.getName()), 0));

		// TODO int distance = |finalcount-originalLength|;
		stmts.add(new StmtVarDecl(new TypePrimitive(4), "HammingDistance", new ExprConstInt(0), 0));

		stmts.add(new StmtVarDecl(new TypePrimitive(4), "EditDistance", new ExprConstInt(0), 0));

		List<Statement> forBody = new ArrayList<Statement>();
		for (String v : varList) {
			if (constMap.containsKey(v)) {
				List<Expression> subCondition = new ArrayList<Expression>();
				for (Integer indexOfv : constMap.get(v)) {
					subCondition.add(new ExprBinary(new ExprVar("const" + (indexOfv - 1) + "change"), "==",
							new ExprConstInt(0), 0));
				}
				Expression ifCondition;
				ifCondition = subCondition.get(0);
				if (subCondition.size() > 1) {
					for (int i = 1; i < subCondition.size(); i++) {
						ifCondition = new ExprBinary(ifCondition, "&&", subCondition.get(i), 0);
					}
				}
				forBody.add(
						new StmtIfThen(ifCondition,
								new StmtAssign(new ExprVar("HammingDistance"),
										new ExprBinary(new ExprArrayRange(v + "Array", "i", 0), "!=",
												new ExprArrayRange("oringianl" + v + "Array", "i", 0), 0),
										1, 1),
								null, 0));

			} else {
				forBody.add(new StmtAssign(new ExprVar("HammingDistance"),
						new ExprBinary(new ExprArrayRange(v + "Array", "i", 0), "!=",
								new ExprArrayRange("oringianl" + v + "Array", "i", 0), 0),
						1, 1));
			}

		}
		
		forBody.add(new StmtAssign(new ExprVar("HammingDistance"),
				new ExprBinary(new ExprArrayRange( "lineArray", "i", 0), "!=",
						new ExprArrayRange("oringianllineArray", "i", 0), 0),
				1, 1));

		StmtBlock editsb = new StmtBlock();
		for (int i = 0; i < constNumber; i++) {
			editsb.addStmt(new StmtAssign(new ExprVar("EditDistance"), new ExprVar("coeff" + i + "change"), 1, 1));
		}
		stmts.add(editsb);
		Statement forinit = new StmtVarDecl(new TypePrimitive(4), "i", new ExprConstInt(0), 0);
		Expression forcon = new ExprBinary(new ExprVar("i"), "<", new ExprConstInt(bound), 0);
		Statement forupdate = new StmtExpr(new ExprUnary(5, new ExprVar("i"), 0), 0);
		stmts.add(new StmtFor(forinit, forcon, forupdate, new StmtBlock(forBody), false, 0));
		for (String v : finalState.getOrdered_locals()) {
			stmts.add(new StmtAssert(
					new ExprBinary(new ExprVar(v + "final"), "==", new ExprVar("correctFinal_" + v), 0)));
		}

		Expression sumOfConstxchange = new ExprVar("const" + 0 + "change");
		stmts.add(new StmtMinimize(new ExprVar("EditDistance"), true));

		stmts.add(new StmtMinimize(new ExprVar("HammingDistance"), true));

		return new Function("HammingTest", new TypeVoid(), new ArrayList<Parameter>(), new StmtBlock(stmts),
				FcnType.Harness);
	}

	static public Function constraintFunction() {
		List<Statement> stmts = new ArrayList<Statement>();

		int bound = (length < originalLength) ? length : originalLength;

		for (String v : varList) {
			List<Expression> arrayInit = new ArrayList<>();
			for (int i = 0; i < bound; i++) {
				if (oriTrace.getTraces().get(i).getOrdered_locals().contains(v)) {
					if (oriTrace.getTraces().get(i).getLocals().find(v).getType() == 0)
						arrayInit.add(
								new ExprConstInt((int) oriTrace.getTraces().get(i).getLocals().find(v).getValue()));
				} else {
					// TODO check if int can be null in Sketch
					arrayInit.add(new ExprConstInt(0));
				}
			}
			for (int i = bound; i < originalLength; i++) {
				arrayInit.add(new ExprConstInt(0));
			}
			stmts.add(new StmtVarDecl(new TypeArray(new TypePrimitive(4), new ExprConstInt(originalLength)),
					"oringianl" + v + "Array", new ExprArrayInit(arrayInit), 0));
		}

		for (String v : finalState.getOrdered_locals()) {
			stmts.add(new StmtVarDecl(new TypePrimitive(4), "correctFinal_" + v,
					new ExprConstInt(finalState.getLocals().find(v).getValue()), 0));
		}

		// f(args)
		stmts.add(new StmtExpr(new ExprFunCall(fh.getName(), args, fh.getName()), 0));

		// TODO int distance = |finalcount-originalLength|;
		stmts.add(new StmtVarDecl(new TypePrimitive(4), "HammingDistance", new ExprConstInt(0), 0));

		List<Statement> forBody = new ArrayList<Statement>();
		for (String v : varList) {
			if (constMap.containsKey(v)) {
				List<Expression> subCondition = new ArrayList<Expression>();
				for (Integer indexOfv : constMap.get(v)) {
					subCondition.add(new ExprBinary(new ExprVar("const" + (indexOfv - 1) + "change"), "==",
							new ExprConstInt(0), 0));
				}
				Expression ifCondition;
				ifCondition = subCondition.get(0);
				if (subCondition.size() > 1) {
					for (int i = 1; i < subCondition.size(); i++) {
						ifCondition = new ExprBinary(ifCondition, "&&", subCondition.get(i), 0);
					}
				}
				forBody.add(
						new StmtIfThen(ifCondition,
								new StmtAssign(new ExprVar("HammingDistance"),
										new ExprBinary(new ExprArrayRange(v + "Array", "i", 0), "!=",
												new ExprArrayRange("oringianl" + v + "Array", "i", 0), 0),
										1, 1),
								null, 0));

			} else {
				forBody.add(new StmtAssign(new ExprVar("HammingDistance"),
						new ExprBinary(new ExprArrayRange(v + "Array", "i", 0), "!=",
								new ExprArrayRange("oringianl" + v + "Array", "i", 0), 0),
						1, 1));
			}

		}
		Statement forinit = new StmtVarDecl(new TypePrimitive(4), "i", new ExprConstInt(0), 0);
		Expression forcon = new ExprBinary(new ExprVar("i"), "<", new ExprConstInt(bound), 0);
		Statement forupdate = new StmtExpr(new ExprUnary(5, new ExprVar("i"), 0), 0);
		stmts.add(new StmtFor(forinit, forcon, forupdate, new StmtBlock(forBody), false, 0));
		for (String v : finalState.getOrdered_locals()) {
			stmts.add(new StmtAssert(
					new ExprBinary(new ExprVar(v + "final"), "==", new ExprVar("correctFinal_" + v), 0)));
		}

		Expression sumOfConstxchange = new ExprVar("const" + 0 + "change");
		for (int i = 1; i < constMap.size(); i++)
			sumOfConstxchange = new ExprBinary(sumOfConstxchange, "+", new ExprVar("const" + i + "change"), 0);
		stmts.add(new StmtAssert(new ExprBinary(sumOfConstxchange, "==", new ExprConstInt(numberOfChange), 0)));

		stmts.add(new StmtMinimize(new ExprVar("HammingDistance"), true));

		return new Function("HammingTest", new TypeVoid(), new ArrayList<Parameter>(), new StmtBlock(stmts),
				FcnType.Harness);
	}

	static public Statement constChangeDecl(int number) {
		return constChangeDecls(number, new TypePrimitive(4));
	}

	static public Statement varArrayDecl(String name, int length, Type type) {
		Type t = new TypeArray(type, new ExprConstInt(length));
		return new StmtVarDecl(t, name + "Array", null, 0);
	}

	static public StmtBlock varArrayDecls(List<String> names, List<Type> types) {
		List<Statement> stmts = new ArrayList<Statement>();
		for (int i = 0; i < names.size(); i++) {
			Type tarray = new TypeArray(types.get(i), new ExprConstInt(length));

			List<Expression> arrayinit = new ArrayList<>();
			for (int j = 0; j < length; j++) {
				arrayinit.add(new ExprConstInt(0));
			}

			stmts.add(new StmtVarDecl(tarray, names.get(i) + "Array", new ExprArrayInit(arrayinit), 0));
		}
		return new StmtBlock(stmts);
	}

	static public Function addConstFun(int index, int ori, Type t) {
		Expression condition = new ExprBinary(new ExprVar("const" + index + "change"), "==", new ExprConstInt(1), 0);
		StmtReturn return_1 = new StmtReturn(new ExprStar(), 0);
		StmtReturn return_2 = new StmtReturn(new ExprConstInt(ori), 0);
		Statement ifst = new StmtIfThen(condition, return_1, return_2, 0);

		return new Function("Const" + index, t, new ArrayList<Parameter>(), ifst, FcnType.Static);
	}

	static public Statement recordState(int lineNumber, List<String> Vars) {
		StmtBlock result = new StmtBlock();
		// count ++
		result.addStmt(new StmtExpr(new ExprUnary(5, new ExprVar("count"), 0), 0));
		// varToUpdateArray[count] = varToUpdate;
		result.addStmt(
				new StmtAssign(
						new ExprArrayRange(new ExprVar("lineArray"),
								new ExprArrayRange.RangeLen(new ExprVar("count"), null), 0),
						new ExprConstInt(lineNumber), 0));
		if (lineNumber == hitline) {
			result.addStmt(new StmtExpr(new ExprUnary(5, new ExprVar("linehit"), 0), 0));
			List<Statement> consStmts = new ArrayList<>();
			for (String v : finalState.getOrdered_locals()) {
				consStmts.add(new StmtAssign(new ExprVar(v + "final"), new ExprVar(v), 0));
			}
			consStmts.add(new StmtAssign(new ExprVar("finalcount"), new ExprVar("count"), 0));
			if (ConstraintFactory.fh.getReturnType() instanceof TypeVoid) {
				consStmts.add(new StmtReturn(0));
			}
			consStmts.add(new StmtReturn(new ExprConstInt(0), 0));
			Statement cons = new StmtBlock(consStmts);
			Statement iflinehit = new StmtIfThen(
					new ExprBinary(new ExprVar("linehit"), "==", new ExprConstInt(ConstraintFactory.hitnumber), 0),
					cons, null, 0);
			result.addStmt(iflinehit);
		}
		for (String s : Vars) {
			result.addStmt(new StmtAssign(new ExprArrayRange(new ExprVar(s + "Array"),
					new ExprArrayRange.RangeLen(new ExprVar("count"), null), 0), new ExprVar(s), 0));
		}
		return result;
	}

	static public Statement replaceConst(Statement source) {
		List<Statement> list = new ArrayList<Statement>();
		Stack<SketchObject> stmtStack = new Stack<SketchObject>();
		int index = 0;
		stmtStack.push(source);
		while (!stmtStack.empty()) {
			SketchObject target = stmtStack.pop();
			ConstData data = null;
			if (ConstraintFactory.limited_range) {
				data = target.replaceConst(index, ConstraintFactory.repair_range);
			} else {
				data = target.replaceConst(index);
			}
			if (data.getType() != null) {
				addToConstMap(data);
				addToConstMapLine(data);
				list.add(constChangeDecl(index, new TypePrimitive(1)));
				list.add(new StmtFunDecl(addConstFun(index, data.getValue(), data.getType())));
			}
			index = data.getIndex();
			pushAll(stmtStack, data.getChildren());
		}
		return new StmtBlock(list);
	}

	private static void addToConstMapLine(ConstData data) {
		constMapLine.put(data.getIndex(), data.getOriline());
	}

	private static void addToConstMap(ConstData data) {
		if (constMap.containsKey(data.getName())) {
			Set<Integer> s = constMap.get(data.getName());
			s.add(data.getIndex());
		} else {
			Set<Integer> s = new HashSet<Integer>();
			s.add(data.getIndex());
			constMap.put(data.getName(), s);
		}
	}

	static public void buildContext(StmtBlock sb) {
		sb.buildContext(new Context());
	}

	static public Map<String, Type> addRecordStmt(StmtBlock sorce) {
		return sorce.addRecordStmt(null, 0, new HashMap<String, Type>());
	}

	@SuppressWarnings({ "rawtypes", "unchecked" })
	static public void pushAll(Stack s, List l) {
		for (int i = l.size() - 1; i >= 0; i--) {
			s.push(l.get(i));
		}
	}

	public static Statement recordState(int linenumber, Map<String, Type> allVars) {
		return recordState(linenumber, new ArrayList<String>(allVars.keySet()));
	}

	public static Map<Integer, Integer> getconstMapLine() {
		return constMapLine;
	}
}
