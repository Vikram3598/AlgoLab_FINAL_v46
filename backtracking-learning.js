'use strict';
(function(){
const langs=['C','C++','Python','Java','JavaScript'];
const data=[
{title:'N-Queens Problem',idea:'Place one queen in each column. For every column, try rows and check whether the candidate shares a row or diagonal with a previously placed queen. If no continuation works, remove the last queen and try another row.',use:'Constraint-satisfaction demonstrations, combinatorial search, scheduling formulations and teaching recursion with pruning.',avoid:'For large N, plain backtracking becomes expensive. Use symmetry breaking, bit masks, or specialized solvers when performance matters; do not assume the first solution is the only solution.',special:'The supplied visualizer uses N = 4 and stops after finding the first solution. Its safety check only needs to inspect columns to the left because queens are placed column by column.',metrics:['Exponential; O(N!) upper bound','Exponential','O(N!) upper bound','O(N) auxiliary']},
{title:'Rat in a Maze',idea:'Start at the source and explore legal neighboring cells. Mark a cell as visited while exploring it. If a route reaches a dead end, undo that choice and try another direction.',use:'Path-search examples, maze solving, grid navigation, and explaining depth-first search with a reversible path state.',avoid:'For large grids, repeated DFS exploration can be costly. If only a shortest path in an unweighted maze is needed, breadth-first search is usually a better fit.',special:'The supplied maze is fixed and uses four-direction movement with a visited matrix, so a cell is not revisited within the same search path. Its worst-case search tree can be exponential in the number of open cells.',metrics:['O(4^(R·C)) upper bound','O(4^(R·C)) upper bound','O(4^(R·C)) upper bound','O(R·C) state/stack']},
{title:'Sudoku Solver',idea:'Find an empty cell, try digits 1 through 9, and keep a digit only when it does not conflict with its row, column, or 3×3 box. Recursively solve the next empty cell; undo the digit if the branch fails.',use:'Constraint-satisfaction problems, puzzle solving, and illustrating candidate validation plus recursive undo.',avoid:'Naive cell-by-cell search can explore many candidates. For harder puzzles, choose the empty cell with the fewest legal candidates (MRV) and maintain candidate sets.',special:'The supplied implementation scans cells row by row and tries digits in ascending order. It displays attempted invalid values as conflict steps; those values are not actually committed to the board.',metrics:['Exponential; up to O(9^E)','Exponential','O(9^E) upper bound','O(E) recursion + board']},
{title:'Graph Coloring (M-Coloring)',idea:'Process vertices in order and assign a color that differs from every already-colored neighbor. If a later vertex has no legal color, undo the current assignment and try another color.',use:'Timetabling, register allocation, frequency assignment, and modeling mutually incompatible tasks.',avoid:'The general coloring problem is computationally hard. For large graphs, use heuristics, constraint solvers, or problem-specific structure rather than naive exhaustive search.',special:'The supplied visualizer colors four vertices using three colors and stops at the first valid coloring. Runtime depends on vertex order and how quickly conflicts prune the search.',metrics:['O(M^V) upper bound','O(M^V) upper bound','O(M^V) upper bound','O(V) auxiliary']},
{title:'Hamiltonian Cycle',idea:'Fix a starting vertex and build a path by adding adjacent vertices that have not appeared earlier. Once every vertex is included, check whether the last vertex connects back to the start; otherwise backtrack.',use:'Route and circuit feasibility, combinatorial graph search, and understanding why visiting every vertex exactly once is difficult.',avoid:'The exhaustive algorithm scales poorly on larger graphs. It is not a shortest-path algorithm; use specialized methods or heuristics for larger routing problems.',special:'The supplied visualizer starts at vertex 0 and stops at the first cycle. Its graph is undirected, so an edge can be traversed in either direction.',metrics:['O(V!) upper bound','O(V!) upper bound','O(V!) upper bound','O(V) auxiliary']},
{title:'Subset Sum',idea:'For each number, branch into two choices: include it in the current subset or exclude it. Record a solution when the sum equals the target; prune a branch when the current sum exceeds the target (valid here because all supplied values are non-negative).',use:'Combinatorial selection, resource combinations, and a classic decision problem related to knapsack and cryptographic complexity examples.',avoid:'The simple search explores up to 2^n subsets. Dynamic programming can be better when the target sum is moderate; the supplied sum-based pruning is not valid for arbitrary negative values.',special:'The supplied visualizer enumerates all subsets for the fixed positive input and target. It continues after finding a match so it can report every matching subset.',metrics:['O(2^n) upper bound','O(2^n) upper bound','O(2^n) upper bound','O(n) recursion/path']}
];
const code=[
{'C':`int safe(int board[4][4], int row, int col) {
    for (int c=0;c<col;c++) if (board[row][c]) return 0;
    for (int r=row-1,c=col-1;r>=0&&c>=0;r--,c--)
        if (board[r][c]) return 0;
    for (int r=row+1,c=col-1;r<4&&c>=0;r++,c--)
        if (board[r][c]) return 0;
    return 1;
}
int solve(int board[4][4], int col) {
    if (col==4) return 1;
    for (int r=0;r<4;r++) if (safe(board,r,col)) {
        board[r][col]=1;
        if (solve(board,col+1)) return 1;
        board[r][col]=0;
    }
    return 0;
}`,'C++':`bool solve(vector<vector<int>>& b, int col) {
    int n=b.size(); if(col==n) return true;
    for(int r=0;r<n;r++) {
        bool ok=true;
        for(int c=0;c<col;c++) if(b[r][c]) ok=false;
        for(int i=r-1,j=col-1;i>=0&&j>=0;i--,j--) if(b[i][j]) ok=false;
        for(int i=r+1,j=col-1;i<n&&j>=0;i++,j--) if(b[i][j]) ok=false;
        if(ok){b[r][col]=1;if(solve(b,col+1))return true;b[r][col]=0;}
    } return false;
}`,'Python':`def solve_n_queens(board, col=0):
    n = len(board)
    if col == n:
        return True
    for row in range(n):
        if safe(board, row, col):
            board[row][col] = 1
            if solve_n_queens(board, col + 1):
                return True
            board[row][col] = 0  # undo choice
    return False`,'Java':`static boolean solve(int[][] board, int col) {
    int n=board.length; if(col==n) return true;
    for(int r=0;r<n;r++) if(isSafe(board,r,col)) {
        board[r][col]=1;
        if(solve(board,col+1)) return true;
        board[r][col]=0;
    } return false;
}`,'JavaScript':`function solveQueens(board, col = 0) {
  const n = board.length;
  if (col === n) return true;
  for (let row = 0; row < n; row++) {
    if (isSafe(board, row, col)) {
      board[row][col] = 1;
      if (solveQueens(board, col + 1)) return true;
      board[row][col] = 0; // undo choice
    }
  }
  return false;
}`},
{'C':`int solveMaze(int maze[N][N], int r, int c, int seen[N][N]) {
    if(r==N-1 && c==N-1) return 1;
    int dr[]={0,1,0,-1}, dc[]={1,0,-1,0};
    seen[r][c]=1;
    for(int k=0;k<4;k++){
        int nr=r+dr[k], nc=c+dc[k];
        if(nr>=0&&nr<N&&nc>=0&&nc<N&&maze[nr][nc]&&!seen[nr][nc])
            if(solveMaze(maze,nr,nc,seen)) return 1;
    }
    seen[r][c]=0; return 0;
}`,'C++':`bool mazePath(vector<vector<int>>& a,int r,int c,vector<vector<int>>& seen){
    int n=a.size(); if(r==n-1&&c==n-1) return true;
    seen[r][c]=1; int dr[]={0,1,0,-1},dc[]={1,0,-1,0};
    for(int k=0;k<4;k++){int nr=r+dr[k],nc=c+dc[k];
        if(nr>=0&&nr<n&&nc>=0&&nc<n&&a[nr][nc]&&!seen[nr][nc]&&mazePath(a,nr,nc,seen))return true;
    } seen[r][c]=0; return false;
}`,'Python':`def maze_path(maze, r=0, c=0, seen=None):
    n = len(maze)
    if seen is None: seen = [[False]*n for _ in range(n)]
    if (r, c) == (n-1, n-1): return True
    seen[r][c] = True
    for dr, dc in ((0,1),(1,0),(0,-1),(-1,0)):
        nr, nc = r+dr, c+dc
        if 0 <= nr < n and 0 <= nc < n and maze[nr][nc] and not seen[nr][nc]:
            if maze_path(maze, nr, nc, seen): return True
    seen[r][c] = False
    return False`,'Java':`static boolean mazePath(int[][] maze,int r,int c,boolean[][] seen){
    int n=maze.length;if(r==n-1&&c==n-1)return true;seen[r][c]=true;
    int[] dr={0,1,0,-1},dc={1,0,-1,0};
    for(int k=0;k<4;k++){int nr=r+dr[k],nc=c+dc[k];
        if(nr>=0&&nr<n&&nc>=0&&nc<n&&maze[nr][nc]==1&&!seen[nr][nc]&&mazePath(maze,nr,nc,seen))return true;
    }seen[r][c]=false;return false;
}`,'JavaScript':`function mazePath(maze, r = 0, c = 0, seen = maze.map(row => row.map(() => false))) {
  const n = maze.length;
  if (r === n-1 && c === n-1) return true;
  seen[r][c] = true;
  for (const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
    const nr=r+dr, nc=c+dc;
    if(nr>=0&&nr<n&&nc>=0&&nc<n&&maze[nr][nc]&&!seen[nr][nc]&&mazePath(maze,nr,nc,seen)) return true;
  }
  seen[r][c] = false; return false;
}`},
{'C':`int solveSudoku(int b[9][9]) {
    int r=-1,c=-1;
    for(int i=0;i<9;i++) for(int j=0;j<9;j++) if(!b[i][j]){r=i;c=j;goto found;}
found:
    if(r==-1) return 1;
    for(int v=1;v<=9;v++) if(valid(b,r,c,v)){
        b[r][c]=v;
        if(solveSudoku(b)) return 1;
        b[r][c]=0;
    } return 0;
}`,'C++':`bool solveSudoku(vector<vector<int>>& b){
    for(int r=0;r<9;r++)for(int c=0;c<9;c++)if(b[r][c]==0){
        for(int v=1;v<=9;v++)if(valid(b,r,c,v)){
            b[r][c]=v;if(solveSudoku(b))return true;b[r][c]=0;
        }return false;
    }return true;
}`,'Python':`def solve_sudoku(board):
    for r in range(9):
        for c in range(9):
            if board[r][c] == 0:
                for value in range(1, 10):
                    if valid(board, r, c, value):
                        board[r][c] = value
                        if solve_sudoku(board): return True
                        board[r][c] = 0  # backtrack
                return False
    return True`,'Java':`static boolean solveSudoku(int[][] b){
    for(int r=0;r<9;r++)for(int c=0;c<9;c++)if(b[r][c]==0){
        for(int v=1;v<=9;v++)if(valid(b,r,c,v)){
            b[r][c]=v;if(solveSudoku(b))return true;b[r][c]=0;
        }return false;
    }return true;
}`,'JavaScript':`function solveSudoku(board) {
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) if (board[r][c]===0) {
    for (let value=1;value<=9;value++) if (isValid(board,r,c,value)) {
      board[r][c]=value;
      if (solveSudoku(board)) return true;
      board[r][c]=0; // backtrack
    }
    return false;
  }
  return true;
}`},
{'C':`int colorGraph(int v,int V,int m,int color[],int adj[V][V]){
    if(v==V)return 1;
    for(int c=1;c<=m;c++){
        int ok=1;for(int u=0;u<V;u++)if(adj[v][u]&&color[u]==c)ok=0;
        if(ok){color[v]=c;if(colorGraph(v+1,V,m,color,adj))return 1;color[v]=0;}
    }return 0;
}`,'C++':`bool colorGraph(int v,const vector<vector<int>>& g,int m,vector<int>& color){
    if(v==(int)g.size())return true;
    for(int c=1;c<=m;c++){
        bool ok=true;for(int u:g[v])if(color[u]==c)ok=false;
        if(ok){color[v]=c;if(colorGraph(v+1,g,m,color))return true;color[v]=0;}
    }return false;
}`,'Python':`def color_graph(graph, m, colors, v=0):
    if v == len(graph): return True
    for color in range(1, m+1):
        if all(colors[u] != color for u in graph[v]):
            colors[v] = color
            if color_graph(graph, m, colors, v+1): return True
            colors[v] = 0
    return False`,'Java':`static boolean colorGraph(int v,List<List<Integer>> g,int m,int[] color){
    if(v==g.size())return true;
    for(int c=1;c<=m;c++){
        boolean ok=true;for(int u:g.get(v))if(color[u]==c)ok=false;
        if(ok){color[v]=c;if(colorGraph(v+1,g,m,color))return true;color[v]=0;}
    }return false;
}`,'JavaScript':`function colorGraph(graph, m, colors, v = 0) {
  if (v === graph.length) return true;
  for (let color=1;color<=m;color++) {
    if (graph[v].every(u => colors[u] !== color)) {
      colors[v]=color;
      if (colorGraph(graph,m,colors,v+1)) return true;
      colors[v]=0;
    }
  }
  return false;
}`},
{'C':`int ham(int path[],int pos,int V,int adj[V][V],int used[]){
    if(pos==V)return adj[path[pos-1]][path[0]];
    for(int v=1;v<V;v++)if(!used[v]&&adj[path[pos-1]][v]){
        path[pos]=v;used[v]=1;
        if(ham(path,pos+1,V,adj,used))return 1;
        used[v]=0;
    }return 0;
}`,'C++':`bool hamCycle(const vector<vector<int>>& g,vector<int>& path,vector<bool>& used){
    int n=g.size();if((int)path.size()==n)return g[path.back()][path[0]]!=0;
    for(int v=1;v<n;v++)if(!used[v]&&g[path.back()][v]){
        path.push_back(v);used[v]=true;
        if(hamCycle(g,path,used))return true;
        used[v]=false;path.pop_back();
    }return false;
}`,'Python':`def hamiltonian_cycle(graph, path, used):
    n = len(graph)
    if len(path) == n:
        return path[0] in graph[path[-1]]
    for v in graph[path[-1]]:
        if not used[v]:
            used[v] = True; path.append(v)
            if hamiltonian_cycle(graph, path, used): return True
            path.pop(); used[v] = False
    return False`,'Java':`static boolean hamCycle(int[][] g,List<Integer> path,boolean[] used){
    int n=g.length;if(path.size()==n)return g[path.get(n-1)][path.get(0)]!=0;
    int last=path.get(path.size()-1);
    for(int v=1;v<n;v++)if(!used[v]&&g[last][v]!=0){
        used[v]=true;path.add(v);if(hamCycle(g,path,used))return true;
        path.remove(path.size()-1);used[v]=false;
    }return false;
}`,'JavaScript':`function hamiltonianCycle(graph, path, used) {
  const n=graph.length;
  if(path.length===n) return graph[path[path.length-1]].includes(path[0]);
  for(const v of graph[path[path.length-1]]) if(!used[v]) {
    used[v]=true;path.push(v);
    if(hamiltonianCycle(graph,path,used)) return true;
    path.pop();used[v]=false;
  }
  return false;
}`},
{'C':`void subsetSum(int a[],int n,int i,int sum,int target,int chosen[],int k){
    if(sum==target){printSubset(chosen,k);return;}
    if(sum>target||i==n)return;
    chosen[k]=a[i];subsetSum(a,n,i+1,sum+a[i],target,chosen,k+1);
    subsetSum(a,n,i+1,sum,target,chosen,k);
}`,'C++':`void subsetSum(const vector<int>& a,int i,int sum,int target,vector<int>& cur){
    if(sum==target){print(cur);return;}
    if(sum>target||i==(int)a.size())return;
    cur.push_back(a[i]);subsetSum(a,i+1,sum+a[i],target,cur);cur.pop_back();
    subsetSum(a,i+1,sum,target,cur);
}`,'Python':`def subset_sum(nums, target, i=0, current=None):
    if current is None: current = []
    if sum(current) == target:
        print(current); return
    if sum(current) > target or i == len(nums): return
    subset_sum(nums, target, i+1, current+[nums[i]])  # include
    subset_sum(nums, target, i+1, current)            # exclude`,'Java':`static void subsetSum(int[] a,int i,int sum,int target,List<Integer> cur){
    if(sum==target){System.out.println(cur);return;}
    if(sum>target||i==a.length)return;
    cur.add(a[i]);subsetSum(a,i+1,sum+a[i],target,cur);cur.remove(cur.size()-1);
    subsetSum(a,i+1,sum,target,cur);
}`,'JavaScript':`function subsetSum(nums, target, i = 0, current = []) {
  const sum = current.reduce((a,b)=>a+b,0);
  if (sum === target) { console.log(current); return; }
  if (sum > target || i === nums.length) return;
  subsetSum(nums,target,i+1,[...current,nums[i]]); // include
  subsetSum(nums,target,i+1,current);              // exclude
}`}
];
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function highlight(src){return esc(src).split('\n').map(line=>{let x=line;if(/^\s*(\/\/|#|\/\*|\*|\*\/)/.test(line))return '<span class="com">'+x+'</span>';x=x.replace(/(".*?"|'.*?')/g,'<span class="str">$1</span>');x=x.replace(/\b(return|if|else|for|while|break|continue|def|class|function|const|let|var|int|void|double|static|new|import|from|include|struct|true|false|null|None|public|private|final|boolean|vector|long|bool|return|range|in|not|and|or)\b/g,'<span class="kw">$1</span>');x=x.replace(/\b(\d+(?:\.\d+)?)\b/g,'<span class="num">$1</span>');return x;}).join('\n');}
function render(i){const d=data[i],target=document.getElementById('btLearn'+i);if(!target)return;const lang=target.querySelector('select')?.value||'Python';target.innerHTML=`<div class="gl-head"><div><div class="btitle">ALGORITHM KNOWLEDGE</div><h3>${d.title} · Theory, Complexity & Code</h3></div><label class="gl-lang">Language <select aria-label="Choose code language">${langs.map(l=>`<option ${l===lang?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="gl-grid"><article class="gl-card"><h4>How it works</h4><p>${d.idea}</p><h4 style="margin-top:14px">Use cases</h4><p>${d.use}</p><h4 style="margin-top:14px">When to avoid it</h4><p>${d.avoid}</p><div class="gl-special"><h4>Special case / implementation note</h4><p>${d.special}</p></div></article><article class="gl-card"><h4>Time and space complexity</h4><div class="gl-metrics">${['Best case','Average case','Worst case','Auxiliary space'].map((label,j)=>`<div class="gl-metric"><b>${label}</b><span>${d.metrics[j]}</span></div>`).join('')}</div><p class="gl-note">N = queens/board dimension, R × C = maze dimensions, E = empty Sudoku cells, M = available colors, V = vertices, n = number of values. Exponential bounds are worst-case upper bounds and actual work depends on pruning.</p><h4 style="margin-top:16px">Implementation</h4><div class="gl-code"><pre><code>${highlight(code[i][lang])}</code></pre></div><p class="gl-note">Select C, C++, Python, Java or JavaScript. Snippets focus on the recursive algorithm; helper functions such as safe(), valid(), graph setup and output formatting may need to be supplied.</p></article></div>`;target.querySelector('select').addEventListener('change',()=>render(i));}
data.forEach((_,i)=>render(i));
})();
