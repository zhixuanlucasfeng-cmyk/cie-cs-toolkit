// Complete classroom programs, shared by Node and browser regression tests.
module.exports = [
  { name:'procedure with no arguments', code:`PROCEDURE Welcome()
OUTPUT "Hello class"
ENDPROCEDURE
CALL Welcome()`, output:'Hello class' },
  { name:'function return in expression', code:`FUNCTION Double(Number : INTEGER) RETURNS INTEGER
RETURN Number * 2
ENDFUNCTION
OUTPUT Double(4) + 1`, output:'9' },
  { name:'parameter names ignore letter case', code:`PROCEDURE Display(Name : STRING)
OUTPUT name
ENDPROCEDURE
CALL Display("Ada")`, output:'Ada' },
  { name:'BYVALUE leaves caller unchanged', code:`PROCEDURE Change(BYVAL Value : INTEGER)
Value ← Value + 1
OUTPUT Value
ENDPROCEDURE
DECLARE Count : INTEGER
Count ← 10
CALL Change(Count)
OUTPUT Count`, output:'11\n10' },
  { name:'BYREF output parameter starts uninitialised', code:`PROCEDURE GetTotal(BYREF Total : INTEGER)
Total ← 42
ENDPROCEDURE
DECLARE Answer : INTEGER
CALL GetTotal(Answer)
OUTPUT Answer`, output:'42' },
  { name:'BYREF aliases update immediately', code:`PROCEDURE Update(BYREF First : INTEGER, BYREF Second : INTEGER)
First ← First + 1
Second ← Second + First
ENDPROCEDURE
DECLARE Value : INTEGER
Value ← 3
CALL Update(Value, Value)
OUTPUT Value`, output:'8' },
  { name:'array passed to procedure by reference', code:`PROCEDURE Fill(BYREF Items : ARRAY[1:3] OF INTEGER)
DECLARE i : INTEGER
FOR i ← 1 TO 3
Items[i] ← i * 10
NEXT i
ENDPROCEDURE
DECLARE Numbers : ARRAY[1:3] OF INTEGER
CALL Fill(Numbers)
OUTPUT Numbers[1], ",", Numbers[3]`, output:'10,30' },
  { name:'array passed to function by value', code:`FUNCTION Sum(Items : ARRAY[1:3] OF INTEGER) RETURNS INTEGER
DECLARE i, Total : INTEGER
Total ← 0
FOR i ← 1 TO 3
Total ← Total + Items[i]
NEXT i
Items[1] ← 999
RETURN Total
ENDFUNCTION
DECLARE Numbers : ARRAY[1:3] OF INTEGER
Numbers[1] ← 10
Numbers[2] ← 20
Numbers[3] ← 30
OUTPUT Sum(Numbers)
OUTPUT Numbers[1]`, output:'60\n10' },
  { name:'recursive function', code:`FUNCTION Factorial(n : INTEGER) RETURNS INTEGER
IF n = 0 THEN
RETURN 1
ELSE
RETURN n * Factorial(n - 1)
ENDIF
ENDFUNCTION
OUTPUT Factorial(5)`, output:'120' },
  { name:'nested function calls', code:`FUNCTION Add(a : INTEGER, b : INTEGER) RETURNS INTEGER
RETURN a + b
ENDFUNCTION
FUNCTION Twice(n : INTEGER) RETURNS INTEGER
RETURN Add(n, n)
ENDFUNCTION
OUTPUT Add(Twice(3), Twice(4))`, output:'14' },
  { name:'procedure reads input', inputs:'7', code:`PROCEDURE ReadScore(BYREF Score : INTEGER)
INPUT Score
ENDPROCEDURE
DECLARE Mark : INTEGER
CALL ReadScore(Mark)
OUTPUT Mark`, output:'7' },
  { name:'function reads input', inputs:'8', code:`FUNCTION ReadDouble() RETURNS INTEGER
DECLARE Value : INTEGER
INPUT Value
RETURN Value * 2
ENDFUNCTION
OUTPUT ReadDouble()`, output:'16' },
  { name:'CASE range and multi-line arm', code:`DECLARE Score : INTEGER
Score ← 72
CASE OF Score
0 TO 49 : OUTPUT "Fail"
50 TO 100 :
OUTPUT "Pass"
OUTPUT Score
OTHERWISE : OUTPUT "Invalid"
ENDCASE`, output:'Pass\n72' },
  { name:'two dimensional array parameter', code:`PROCEDURE Mark(BYREF Grid : ARRAY[1:2, 1:2] OF CHAR)
Grid[2, 1] ← 'X'
ENDPROCEDURE
DECLARE Board : ARRAY[1:2, 1:2] OF CHAR
CALL Mark(Board)
OUTPUT Board[2, 1]`, output:'X' }
];
