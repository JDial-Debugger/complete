package sketchobj.expr;

import java.util.ArrayList;
import java.util.List;

import constraintfactory.ConstData;
import constraintfactory.ExternalFunction;
import sketchobj.core.Type;

public class ExprField extends Expression
{
    private Expression left;
    private String name;
    private boolean hole;
    private Type typeOfHole = null;

	private int line;
    private boolean isLValue = true;

    /** Creates a new field-reference expression, referencing the
     * named field of the specified expression. */
    public ExprField( Expression left, String name, boolean hole)
    {
    	left.setParent(this);
        this.left = left;
        this.name = name;
        this.hole = hole;
    }

    public ExprField( Expression left, String name) {
    	left.setParent(this);
        this.left = left;
        this.name = name;
        this.hole = false;
    }





    public boolean isHole() {
        return hole;
    }

    public Type getTypeOfHole() {
        return typeOfHole;
    }

    public void setTypeOfHole(Type t) {
        typeOfHole = t;
    }
    /** Returns the expression we're taking a field from. */
    public Expression getLeft() { return left; }

    /** Returns the name of the field. */
    public String getName() { return name; }

    /**
     * Determine if this expression can be assigned to. Fields can always be assigned to.
     * Not if the struct is immutable
     * 
     * @return always true
     */
    public boolean isLValue()
    {
        return isLValue;
    }

    public void setIsLValue(boolean val) {
        isLValue = val;
    }

    public String toString()
    {
        return left + "." + name;
    }

    public boolean equals(Object other)
    {
        if (!(other instanceof ExprField))
            return false;
        ExprField that = (ExprField)other;
        if (!(this.left.equals(that.left)))
            return false;
        if (!(this.name.equals(that.name)))
            return false;
        return true;
    }

    public int hashCode()
    {
        return left.hashCode() ^ name.hashCode();
    }

	@Override
	public ConstData replaceConst(int index) {
		// TODO Auto-generated method stub
		return new ConstData(index,this.line);
	}

	@Override
	public ConstData replaceConst(int index, String string) {
		// TODO Auto-generated method stub
		return new ConstData(index,string,this.line);
	}

	@Override
	public boolean equals(Expression other) {
		// TODO Auto-generated method stub
		return false;
	}


	@Override
	public List<ExternalFunction> extractExternalFuncs(List<ExternalFunction> externalFuncNames) {
		return externalFuncNames;
	}

	@Override
	public void checkAtom() {
		this.setAtom(true);
		
	}

	@Override
	public ConstData replaceLinearCombination(int index) {
		return new ConstData(null, new ArrayList<>(), index, 0, null,0);
	}
}