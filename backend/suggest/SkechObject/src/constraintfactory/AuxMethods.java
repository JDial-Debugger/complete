package constraintfactory;

import java.util.ArrayList;
import java.util.List;

import jsonast.*;
import sketchobj.core.*;
import sketchobj.expr.*;
import sketchobj.stmts.*;

public class AuxMethods {

	
	static public List<Expression> extractArguments(Traces traces, int targetindex){
		List<Expression> result = new ArrayList<>();
		
		List<Trace> tracelist = traces.getTraces();
		Trace callTrace = null;
		for(int i = targetindex; i >=0; i--){
			if(tracelist.get(i).getEvent().equals("call")){
				callTrace = tracelist.get(i);
			break;
			}
		}
		
		List<Var> args = callTrace.getLocals().getVar();
		List<Var> heapObjs = callTrace.getHeap().getVar();
		
		for(Var v: args){
			if(v.getType() == 0){
				result.add(new ExprString(v.getValue().toString()));
			}
			if(v.getType() == 1){
				Integer heapIndex = v.getValue();
				for(Var h: heapObjs){
					if(h.getName().equals(heapIndex.toString())){
						result.add(new ExprString(h.getListasString()));
						break;
					}
				}
				
			}
			if(v.getType() == 3){
				System.out.println("error");
			}
		}
		
		
		return result;
	}
	
	static public String listToString(List l){
		String result = "[" + l.get(0).toString();
		for(int i = 1; i < l.size(); i++){
			result += "," +l.get(i);
		}
		return result + "]";
		
	}
}
