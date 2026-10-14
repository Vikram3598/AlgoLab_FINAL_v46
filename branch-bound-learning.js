'use strict';
(function(){
const langs=['C','C++','Python','Java','JavaScript'];
const data=[
{title:'Traveling Salesperson Problem (Branch and Bound)',idea:'Build a partial tour from a fixed start city. At each decision, estimate a lower bound on the cheapest possible completed tour. If that bound is already no better than the best complete tour found, discard the entire branch; otherwise continue exploring.',use:'Exact solutions for small routing instances, delivery-tour planning prototypes, and teaching state-space search with admissible lower bounds.',avoid:'Do not use this exhaustive method for large TSP instances without stronger bounds or specialized solvers. Worst-case work remains factorial, and a weak or invalid bound can make pruning ineffective or incorrect.',special:'The supplied visualizer uses four cities and a symmetric cost matrix. Its lower-bound calculations are intended to illustrate pruning; the displayed implementation is a small teaching example, not a general-purpose TSP solver for arbitrary graphs.',metrics:['Exponential/factorial search','Exponential/factorial search','O(n!) worst case','O(n) recursion/path']},
{title:'0/1 Knapsack (Branch and Bound)',idea:'Sort items by value-to-weight ratio. At every node, branch into taking or skipping the next item. Estimate the best possible value remaining by allowing a fractional part of the next item; because this relaxation is optimistic, a branch whose upper bound cannot beat the best feasible value may be pruned.',use:'Exact knapsack solutions for moderate input sizes, resource allocation examples, and demonstrating optimization using upper bounds.',avoid:'For large item counts, worst-case search remains exponential. Dynamic programming can be preferable when the capacity is a manageable integer; greedy ratio sorting alone does not solve 0/1 knapsack optimally.',special:'The supplied visualizer uses a fixed capacity and positive item values/weights. The fractional calculation is an upper bound for the 0/1 problem, not a feasible 0/1 solution; only complete selections update the best feasible value.',metrics:['O(2^n) worst-case search','O(2^n) worst-case search','O(2^n) worst case','O(n) recursion/path']}
];
const code=[
{'C':`/* Assumes a complete symmetric cost matrix w[n][n]. */
void tsp(int n, int w[10][10], int path[], int used[],
         int depth, int cost, int *best) {
    if (depth == n) {
        int total = cost + w[path[depth-1]][path[0]];
        if (total < *best) *best = total;
        return;
    }
    for (int v = 1; v < n; ++v) {
        if (!used[v]) {
            int nextCost = cost + w[path[depth-1]][v];
            /* lowerBound() must be admissible for safe pruning. */
            if (lowerBound(n, w, path, used, depth, v, nextCost) < *best) {
                used[v] = 1; path[depth] = v;
                tsp(n, w, path, used, depth+1, nextCost, best);
                used[v] = 0; /* backtrack */
            }
        }
    }
}`,
'C++':`// lowerBound() must return an admissible lower bound.
void tsp(const vector<vector<int>>& w, vector<int>& path,
         vector<bool>& used, int cost, int& best) {
    int n = (int)w.size();
    if ((int)path.size() == n) {
        best = min(best, cost + w[path.back()][path.front()]);
        return;
    }
    for (int v = 1; v < n; ++v) if (!used[v]) {
        int nextCost = cost + w[path.back()][v];
        if (lowerBound(w, path, used, v, nextCost) < best) {
            used[v] = true; path.push_back(v);
            tsp(w, path, used, nextCost, best);
            path.pop_back(); used[v] = false;
        }
    }
}`,
'Python':`def tsp_branch_bound(cost, path, used, current_cost, best):
    n = len(cost)
    if len(path) == n:
        return min(best, current_cost + cost[path[-1]][path[0]])
    for city in range(1, n):
        if not used[city]:
            next_cost = current_cost + cost[path[-1]][city]
            # lower_bound() must never overestimate the remaining cost.
            if lower_bound(cost, path, used, city, next_cost) < best:
                used[city] = True
                path.append(city)
                best = tsp_branch_bound(cost, path, used, next_cost, best)
                path.pop()
                used[city] = False
    return best`,
'Java':`static int tsp(int[][] cost, List<Integer> path,
                boolean[] used, int current, int best) {
    int n = cost.length;
    if (path.size() == n)
        return Math.min(best, current + cost[path.get(n-1)][path.get(0)]);
    for (int city = 1; city < n; city++) if (!used[city]) {
        int next = current + cost[path.get(path.size()-1)][city];
        if (lowerBound(cost, path, used, city, next) < best) {
            used[city] = true; path.add(city);
            best = tsp(cost, path, used, next, best);
            path.remove(path.size()-1); used[city] = false;
        }
    }
    return best;
}`,
'JavaScript':`function tspBranchBound(cost, path, used, currentCost, best) {
  const n = cost.length;
  if (path.length === n)
    return Math.min(best, currentCost + cost[path[n - 1]][path[0]]);
  for (let city = 1; city < n; city++) if (!used[city]) {
    const nextCost = currentCost + cost[path[path.length - 1]][city];
    // lowerBound() must be admissible to preserve optimality.
    if (lowerBound(cost, path, used, city, nextCost) < best) {
      used[city] = true; path.push(city);
      best = tspBranchBound(cost, path, used, nextCost, best);
      path.pop(); used[city] = false;
    }
  }
  return best;
}`},
{'C':`/* Items are sorted by descending value/weight ratio. */
void knapsack(int i, int n, int capacity, int weight, int value,
              Item items[], int *best) {
    if (weight > capacity) return;
    if (i == n) { if (value > *best) *best = value; return; }
    double bound = fractionalBound(items, i, capacity-weight, value, n);
    if (bound <= *best) return; /* prune */
    if (weight + items[i].weight <= capacity)
        knapsack(i+1,n,capacity,weight+items[i].weight,
                 value+items[i].value,items,best);
    knapsack(i+1,n,capacity,weight,value,items,best); /* skip */
}`,
'C++':`struct Item { int weight, value; double ratio; };
void knapsack(int i, int capacity, int weight, int value,
              const vector<Item>& items, int& best) {
    int n = (int)items.size();
    if (weight > capacity) return;
    if (i == n) { best = max(best, value); return; }
    if (fractionalBound(items, i, capacity-weight, value) <= best) return;
    if (weight + items[i].weight <= capacity)
        knapsack(i+1,capacity,weight+items[i].weight,
                 value+items[i].value,items,best);
    knapsack(i+1,capacity,weight,value,items,best);
}`,
'Python':`def knapsack_bb(items, i, capacity, weight, value, best):
    if weight > capacity:
        return best
    if i == len(items):
        return max(best, value)
    # items are sorted by value/weight ratio; bound may take a fraction.
    if fractional_bound(items, i, capacity - weight, value) <= best:
        return best
    item = items[i]
    if weight + item.weight <= capacity:
        best = knapsack_bb(items, i + 1, capacity,
                           weight + item.weight, value + item.value, best)
    return knapsack_bb(items, i + 1, capacity, weight, value, best)`,
'Java':`static int knapsack(Item[] items, int i, int capacity,
                      int weight, int value, int best) {
    if (weight > capacity) return best;
    if (i == items.length) return Math.max(best, value);
    if (fractionalBound(items, i, capacity-weight, value) <= best) return best;
    if (weight + items[i].weight <= capacity)
        best = knapsack(items,i+1,capacity,weight+items[i].weight,
                        value+items[i].value,best);
    return knapsack(items,i+1,capacity,weight,value,best);
}`,
'JavaScript':`function knapsackBB(items, i, capacity, weight, value, best) {
  if (weight > capacity) return best;
  if (i === items.length) return Math.max(best, value);
  // fractionalBound is an optimistic upper bound, not a valid selection.
  if (fractionalBound(items, i, capacity - weight, value) <= best) return best;
  const item = items[i];
  if (weight + item.weight <= capacity)
    best = knapsackBB(items, i + 1, capacity, weight + item.weight,
                      value + item.value, best);
  return knapsackBB(items, i + 1, capacity, weight, value, best);
}`}
];
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function highlight(src){return esc(src).split('\n').map(line=>{let x=line;if(/^\s*(\/\/|#|\/\*|\*)/.test(line))return '<span class="com">'+x+'</span>';x=x.replace(/(".*?"|'.*?')/g,'<span class="str">$1</span>');x=x.replace(/\b(return|if|else|for|while|break|continue|def|class|function|const|let|var|int|void|double|static|new|import|from|include|struct|true|false|null|None|public|private|final|boolean|vector|long|bool|return|range|in|not|and|or|return|this|Math|min|max)\b/g,'<span class="kw">$1</span>');x=x.replace(/\b(\d+(?:\.\d+)?)\b/g,'<span class="num">$1</span>');return x;}).join('\n');}
function render(i){const d=data[i],target=document.getElementById('bbLearn'+i);if(!target)return;const lang=target.querySelector('select')?.value||'C';target.innerHTML=`<div class="gl-head"><div><div style="font-size:.7rem;color:var(--dim);letter-spacing:1.3px;font-weight:800">ALGORITHM KNOWLEDGE</div><h3>${d.title} · Theory, Complexity & Code</h3></div><label class="gl-lang">Language <select aria-label="Choose code language">${langs.map(l=>`<option ${l===lang?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="gl-grid"><article class="gl-card"><h4>How it works</h4><p>${d.idea}</p><h4 style="margin-top:14px">Use cases</h4><p>${d.use}</p><h4 style="margin-top:14px">When to avoid it</h4><p>${d.avoid}</p><div class="gl-special"><h4>Special case / implementation note</h4><p>${d.special}</p></div></article><article class="gl-card"><h4>Time and space complexity</h4><div class="gl-metrics">${['Best case','Average case','Worst case','Auxiliary space'].map((label,j)=>`<div class="gl-metric"><b>${label}</b><span>${d.metrics[j]}</span></div>`).join('')}</div><p class="gl-note">Complexity depends on the quality of the bound and the amount of pruning. These are general worst-case bounds; the snippets are educational templates and rely on helper functions such as lowerBound() or fractionalBound().</p><h4 style="margin-top:16px">Implementation</h4><div class="gl-code"><pre><code>${highlight(code[i][lang])}</code></pre></div><p class="gl-note">Language order: C, C++, Python, Java, JavaScript. Snippets focus on the search logic; data structures, helper bounds and program entry points may need to be supplied.</p></article></div>`;target.querySelector('select').addEventListener('change',()=>render(i));}
render(0);render(1);
})();
