# brainfuck2-interpreter
Work in progress interpreter for an interpreter for the [Brainfuck](https://esolangs.org/wiki/Brainfuck) esoteric programming language.

Suppourts a custom superset aswell, which doesn't have a proper name other than *brainfuck2*. This languae *should* have compatiabally with normal brainfuck code that doesn't have `{{idx}}` or `||idx||` comments, or a comment with ```p `` string`` ```. It also shouldn't have any non-comment semicolons.

[**brainfuck2**](https://esolangs.org/wiki/Brainfuck2) suppourts 3 new (by *new* i mean not in normal brainfuck; None of these ideas are new to all brainfuck-based esolangs as of yet) ideas, and i will probably add more later. I'll probably remove this part when it falls out of date, but keep maintaining the esolangs.org link.

## 1. Functions
Brainfuck2 suppourts the idea of functions. A function would be defined as this: 
```
    {{1}} ; Define a function with index one
    <\[>++++++++++<-\]>.\[-\]< ; Function body
    ;;; ; End function. Don't confuse this syntax with single-semicolon somment syntax
```

You would then call a function like this: 
```
    ++++++>+++++||1|| ; Call function 1 to print char 65 "A"
```

Due to how nested functions are handled, functions can only have a numerical index.

## 2. Print statements

```p ``string`` ``` prints "string". ***fin***

## 3. "Explicit" comments

`comment` and `; comment` are the same, but `comment>` has `>` as code that will be executed.

`; comment>` ignores the `>` as the semicolon makes the comment **explicit**. Explicit comments are automatically removed from where the semicolon is to the end of the line, ensuring any code there isn't actually executed.
