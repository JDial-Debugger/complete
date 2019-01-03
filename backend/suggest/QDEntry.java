import java.util.*;
import java.io.*;

public class QDEntry {
    public static void main(String[] args) {
        String wholeFilename = args[0];
        int offset = Integer.parseInt(args[1]);
        String partFilename = args[2];
        //System.out.println("WHOLE: " + wholeFilename);
        //System.out.println("PART: " + partFilename);

        String whole;
        String part;


        try {
            whole = new Scanner(new File(wholeFilename)).useDelimiter("\\Z").next();
            part = new Scanner(new File(partFilename)).useDelimiter("\\Z").next();
        } catch (Exception e) {
            System.out.println("failed with I/O error");
            return;
        }


        MainEntrance ent = new MainEntrance(whole, part, offset);


        try {
            ent.Synthesize();
        } catch (InterruptedException e) {
            System.out.println("failed with interrupted error");
            return;
        } catch (Exception e) {
            System.out.println(e);
            e.printStackTrace(System.out);
            return;
        }
    }
}
