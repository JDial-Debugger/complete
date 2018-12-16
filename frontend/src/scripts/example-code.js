export const BUILTIN_PROGRAMS =
{
  'tests': `public class Main {
    static int SimpleJava() {
        int a = 2;
        int b = a + 1;
        int c = a + b;
        return c;
    }

    public static void main(String[] args) {
        int x = SimpleJava();
        System.out.println(x);
    }
}`,
  'hello': `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello world");
    }
}`,
  'conditional': `public class Main {
    static int SimpleJava() {
        int a = 2;
        int b = a + 1;
        if(3 == a)
          b = 7;
        int c = a + b;
        return c;
    }

    public static void main(String[] args) {
        int x = SimpleJava();
        System.out.println(x);
    }
}`,
'largestGap': `public class Main
{
    public static int largestGap(){
      int[] a = {9, 5 , 4};
      int N = 3;
      int max = 0;
      int min = 100;
      for(int i=0; i < N; i++){
         if(max < a[i]) max = a[i];
         if(min > a[i]) min = a[i];
      }
	  return max-min;
	}

	public static void main(String[] args)
	{
	    int x = largestGap();
	    System.out.println(x);
	}
}`,
'triple': `public class Main
{
    public static int triple(int x){
    	int y = 3 * x;
    	if(x == 10)
    		y = 30;
    	return y;
	}

	public static void main(String[] args)
	{
	    int x = triple(9);
	    System.out.println(x);
	}
}`,
'sumPow': `public class Main
{
    public static int sumPow(int x){
		int sum = 1;
		for(int i = 1; i < x; i++) {
			sum += Math.pow(2,i);
		}
		return sum;

	}

	public static void main(String[] args)
	{
	    int x = triple(9);
	    System.out.println(x);
	}
}`,
  'custom': ``
}
