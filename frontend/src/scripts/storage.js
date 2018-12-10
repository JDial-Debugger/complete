const WORKING_PROGRAM_KEY = 'working_program_copy'

const BUILTIN_PROGRAMS = {
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
  'custom': ``
}

class Storage {
  static workingCopyExists (cb) {
    if (typeof cb !== 'function') {
      throw new Error('expected 1st arg. of Storage.workingCopyExists() to be a function')
    }

    localforage.getItem(WORKING_PROGRAM_KEY)
      .then((value) => {
        let exists = (typeof value === 'string')
        cb.apply({}, [null, exists])
      })
      .catch((err) => {
        cb.apply({}, [err])
      })
  }

  static getWorkingCopy (cb) {
    if (typeof cb !== 'function') {
      throw new Error('expected 1st arg. of Storage.getWorkingCopy() to be a function')
    }

    localforage.getItem(WORKING_PROGRAM_KEY)
      .then((value) => {
        if (typeof value !== 'string') {
          value = ''
        }

        cb.apply({}, [null, value])
      })
      .catch((err) => {
        cb.apply({}, [err])
      })
  }

  static setWorkingCopy (newValue, cb) {
    if (typeof newValue !== 'string') {
      throw new Error('expected 1st arg. of Storage.setWorkingCopy() to be a string')
    }

    if (typeof cb !== 'function') {
      throw new Error('expected 2nd arg. of Storage.setWorkingCopy() to be a function')
    }

    localforage.setItem(WORKING_PROGRAM_KEY, newValue)
      .then((value) => {
        cb.apply({}, [null, value])
      })
      .catch((err) => {
        cb.apply({}, [err])
      })
  }

  static setWorkingCopyFromBuiltin (builtinID, cb) {
    if (typeof builtinID !== 'string') {
      let err = new Error('expected 1st arg. of Storage.setWorkingCopyFromDefault() to be a string')
      return void cb.apply({}, [err])
    }

    if (BUILTIN_PROGRAMS.hasOwnProperty(builtinID) === false) {
      let err = new Error('1st arg. of Storage.setWorkingCopyFromDefault() not a valid ID')
      return void cb.apply({}, [err])
    }

    if (typeof cb !== 'function') {
      let err = new Error('expected 3rd arg. of Storage.setWorkingCopy() to be a function')
      return void cb.apply({}, [err])
    }

    Storage.setWorkingCopy(BUILTIN_PROGRAMS[builtinID], cb)
  }

  static clear (force = false) {
    if (force === true || window.confirm('Clear local storage?')) {
      localforage.clear()
        .then(() => {
          console.log('Local storage cleared')
        })
        .catch((err) => {
          console.error('Could not clear local storage. Error has been logged')
          console.error(err)
        })
    }
  }

  static workingCopyMatchesBuiltin (testProgram) {
    let keys = Object.keys(BUILTIN_PROGRAMS)

    for (let i = 0, len = keys.length; i < len; i++) {
      let key = keys[i]

      if (BUILTIN_PROGRAMS[key] === testProgram) {
        return key
      }
    }

    return false
  }
}

export default Storage
