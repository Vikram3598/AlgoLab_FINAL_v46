/* AlgoLab - browser conversion of the supplied Python classroom visualizers.
   The simulation state is explicit; rendering never performs sorting. */
const $=id=>document.getElementById(id);
const clone=a=>a.slice();
const configs={
 bubble:{name:'Bubble Sort',desc:'Compare neighbouring values and move larger values right.',array:[72,35,91,18,56,43,27,84,12,63],complexity:['O(n²)','O(n²)','O(1)'],special:'This classroom simulator does not use an early-exit flag, so even an already-sorted array takes O(n²) comparisons here. An optimized Bubble Sort can reach O(n) best-case time with early termination.',keys:'SPACE Play/Pause · N Step · R Reset · S New Array'},
 insertion:{name:'Insertion Sort',desc:'Pick one key value, shift larger values right, then insert it.',array:[72,35,91,18,56,43,27],complexity:['O(n)','O(n²)','O(1)'],special:'Best case is O(n) when the input is already sorted. Reverse-sorted input triggers the maximum shifting and gives O(n²) time.'},
 selection:{name:'Selection Sort · Classroom',desc:'Find the minimum in the unsorted region, then place it at the next sorted position.',array:[72,35,91,18,56,43,27],complexity:['O(n²)','O(n²)','O(1)'],special:'Selection Sort still performs about n(n−1)/2 comparisons even when the input is already sorted. It usually makes at most n−1 swaps.'},
 merge:{name:'Merge Sort',desc:'Divide into runs and merge adjacent sorted runs in order.',array:[72,35,91,18,56,43,27],complexity:['O(n log n)','O(n log n)','O(n)'],special:'For arrays, the standard implementation needs O(n) auxiliary space. Merge Sort is stable when equal items are taken from the left run first.'},
 quick:{name:'Quick Sort',desc:'Use the last element as pivot and partition the current range.',array:[72,35,91,18,56,43,27,64],complexity:['O(n log n)','O(n²)','O(log n)'],special:'This lab always chooses the last element as pivot. Already sorted or reverse-sorted inputs can therefore trigger O(n²) time and O(n) recursion depth. Randomized pivots or introsort reduce this risk.'},
 heap:{name:'Heap Sort',desc:'Build a max heap, then repeatedly extract the maximum.',array:[72,35,91,18,56,43,27],complexity:['O(n log n)','O(n log n)','O(1)'],special:'The O(1) auxiliary-space claim assumes an iterative in-place heap implementation. Recursive heapify can use O(log n) call-stack space.'},
 counting:{name:'Counting Sort',desc:'Count values, build prefix sums, then place from right to left.',array:[4,2,7,3,2,6,4,1,5,3],complexity:['O(n+k)','O(n+k)','O(n+k)'],special:'k is the integer key-range size (max − min + 1). If k is enormous compared with n, memory and initialization costs can make Counting Sort inefficient.'},
 radix:{name:'Radix Sort',desc:'Process least-significant digits using ten stable buckets.',array:[329,457,657,839,436,720,355],complexity:['O(d·n)','O(d·n)','O(n+b)'],special:'d is the number of digit passes and b is the radix/base (10 here). This implementation is for non-negative integers; negative numbers need a separate handling strategy.'},
 bucket:{name:'Bucket Sort',desc:'Distribute values into range buckets, sort each bucket, collect.',array:[42,17,89,33,71,24,58,12],complexity:['O(n+k)','O(n²)','O(n+k)'],special:'Expected O(n+k) assumes values are reasonably evenly distributed. If most values land in one bucket, insertion-style sorting inside that bucket can degrade to O(n²).'}
};
class Sim{
 constructor(type){this.type=type;this.reset();}
 reset(){this.array=clone(configs[this.type].array);this.defaultArray=clone(this.array);this.running=false;this.think=false;this.state='IDLE';this.msg='Press PLAY to begin.';this.comparisons=0;this.swaps=0;this.moves=0;this.phase='READY';this.current=null;this.extra={};this.initSpecific();}
 initSpecific(){const n=this.array.length;this.extra={};
  if(this.type==='bubble')Object.assign(this.extra,{pass:0,left:-1,right:-1,moveFrom:-1,moveTo:-1});
  if(this.type==='insertion')Object.assign(this.extra,{pos:1,key:null,keyOriginal:null,compare:-1,shiftValue:null,shiftFrom:-1,shiftTo:-1});
  if(this.type==='selection')Object.assign(this.extra,{pos:0,compare:1,min:0});
  if(this.type==='merge')Object.assign(this.extra,{jobs:this.jobs(n),job:0,start:0,mid:0,end:0,left:[],right:[],li:0,ri:0,merged:[],mergeNumber:0,moveSource:'',moveFrom:-1,moveTo:-1,treeActive:-1,treePhase:'DIVIDE'});
  if(this.type==='quick')Object.assign(this.extra,{stack:[[0,n-1]],low:-1,high:-1,pivotIndex:-1,pivotValue:null,scan:-1,boundary:-1,stage:'NONE',sorted:new Set()});
  if(this.type==='heap')Object.assign(this.extra,{buildIndex:Math.floor(n/2)-1,heapSize:n,node:null,compareNode:null,largest:null,heapifyCount:0,sub:'BUILD',moveFrom:-1,moveTo:-1,mode:'MAX',movingValue:null});
  if(this.type==='counting'){const min=Math.min(...this.array),max=Math.max(...this.array);Object.assign(this.extra,{min,max,counts:Array(max-min+1).fill(0),prefix:Array(max-min+1).fill(0),output:Array(n).fill(null),idx:0,value:null,outputIndex:0});}
  if(this.type==='radix')Object.assign(this.extra,{place:1,digitLabel:'ONES',idx:0,num:null,bucket:null,collectBucket:0,buckets:Array.from({length:10},()=>[]),output:[],passes:0,maxPlace:this.maxPlace(),moveFrom:-1,moveTo:-1,movingValue:null,moveKind:'',sourceIndex:-1,liveArray:clone(this.array)});
  if(this.type==='bucket'){this.makeBuckets();}
 }
 jobs(n){let j=[],size=1;while(size<n){for(let s=0;s<n;s+=size*2){const m=Math.min(s+size,n),e=Math.min(s+2*size,n);if(m<e)j.push([s,m,e]);}size*=2;}return j}
 maxPlace(){let m=Math.max(...this.array),p=1;while(m>=10){m=Math.floor(m/10);p*=10;}return p}
 makeBuckets(){const n=this.array.length;this.extra.bucketCount=n?Math.min(5,Math.max(3,Math.floor(n/2))):1;this.extra.bucketMin=0;this.extra.bucketMax=0;this.extra.buckets=Array.from({length:this.extra.bucketCount},()=>[]);this.extra.sortBucket=-1;this.extra.sortIndex=0;this.extra.idx=0;this.extra.result=[];this.extra.moveFrom=-1;this.extra.moveTo=-1;this.extra.movingValue=null;this.extra.moveKind='';this.extra.liveArray=clone(this.array);}
 set(msg,state=this.state){this.msg=msg;this.state=state;this.phase=state;}
 play(){if(this.state==='DONE')return;this.running=true;if(this.state==='IDLE')this.step(true);else if(this.state==='THINK'){}else this.step(true)}
 pause(){this.running=false;this.msg='⏸ PAUSED — press PLAY to continue.'}
 toggleThink(){this.think=!this.think;this.msg=this.think?'🤔 THINK MODE ON — predict before each decision.':'THINK MODE OFF — decisions reveal automatically.'}
 reveal(){if(this.state==='THINK'){this.running=true;const m={insertion:'COMPARE',selection:'COMPARE',merge:'COMPARE',quick:'COMPARE',heap:'COMPARE',counting:'COUNTING',radix:'READING',bucket:'SORTING'}[this.type];if(m)this.state=m;this.step(true,true)}}
 step(auto=false,revealed=false){if(this.state==='DONE')return; if(this.type==='bubble')return this.bubbleStep(); if(this.type==='insertion')return this.insertionStep(revealed); if(this.type==='selection')return this.selectionStep(revealed); if(this.type==='merge')return this.mergeStep(revealed); if(this.type==='quick')return this.quickStep(revealed); if(this.type==='heap')return this.heapStep(revealed); if(this.type==='counting')return this.countingStep(revealed); if(this.type==='radix')return this.radixStep(revealed); if(this.type==='bucket')return this.bucketStep(revealed)}
 bubbleStep(){const e=this.extra,n=this.array.length;if(e.pass>=n-1){this.state='DONE';this.running=false;e.left=e.right=-1;this.msg='🎉 BUBBLE SORT COMPLETE';return}if(e.left===-1){e.left=0;e.right=1;this.comparisons++;this.state='COMPARE';this.current=[0,1];this.msg=`Compare ${this.array[0]} and ${this.array[1]}`;return}if(e.right>=n-e.pass){e.pass++;e.left=e.right=-1;this.state='PASS';this.msg=`Pass ${e.pass} complete.`;return}const l=e.left,r=e.right;if(this.array[l]>this.array[r]){[this.array[l],this.array[r]]=[this.array[r],this.array[l]];this.swaps++;this.state='SWAP';e.moveFrom=l;e.moveTo=r;this.msg=`Swap ${this.array[l]} and ${this.array[r]}`;}else{this.state='NO_SWAP';this.msg=`No swap: ${this.array[l]} ≤ ${this.array[r]}`}this.current=[l,r];e.left++;e.right++;}
 insertionStep(reveal=false){const e=this.extra,n=this.array.length;if(e.pos>=n&&this.state==='INSERTING'){this.state='DONE';this.running=false;this.msg='🎉 INSERTION SORT COMPLETE';return}if(this.state==='IDLE'){e.pos=1;this.state='PICK';this.msg=`Pick ${this.array[e.pos]} as KEY.`;return}if(this.state==='PICK'){e.shiftFrom=e.shiftTo=-1;e.key=this.array[e.pos];e.compare=e.pos-1;e.shiftValue=null;this.state='COMPARE';this.msg=`Compare KEY ${e.key} with ${this.array[e.compare]}`;return}if(this.state==='THINK'&&!reveal)return this.insertionDecision();if(this.state==='COMPARE'){if(this.think&&!reveal){this.state='THINK';this.msg=`🤔 Should ${e.key} move before ${this.array[e.compare]}?`;return}return this.insertionDecision()}if(this.state==='SHIFTING'){return this.finishInsertionShift();}if(this.state==='MOVING_KEY'){this.array[e.pos]=e.key;this.state='INSERTING';this.msg=`Insert KEY ${e.key} at position ${e.pos}.`;return}if(this.state==='INSERTING'){e.pos++;if(e.pos>=n){this.state='DONE';this.running=false;this.msg='🎉 INSERTION SORT COMPLETE'}else{this.state='PICK';this.msg=`Pick ${this.array[e.pos]} as KEY.`}return}}
 insertionDecision(){const e=this.extra;if(e.compare>=0&&this.array[e.compare]>e.key){this.comparisons++;e.shiftValue=this.array[e.compare];e.shiftFrom=e.compare;e.shiftTo=e.compare+1;this.state='SHIFTING';this.msg=`Shift ${e.shiftValue} one position right.`}else{e.pos=e.compare+1;this.state='MOVING_KEY';this.msg=`KEY ${e.key} belongs at position ${e.pos}.`}}
 finishInsertionShift(){const e=this.extra;this.array[e.shiftTo]=this.array[e.shiftFrom];e.compare--;this.moves++;this.state='COMPARE';this.msg=e.compare>=0?`Compare KEY ${e.key} with ${this.array[e.compare]}`:`Insert KEY ${e.key} at the front.`}
 selectionStep(reveal=false){const e=this.extra,n=this.array.length;
  if(this.state==='IDLE'){e.pos=0;e.compare=1;e.min=0;this.state='PICK';this.msg=`Start Pass 1. Current minimum = ${this.array[0]}.`;return}
  if(this.state==='THINK'&&!reveal)return this.selectionReveal();
  if(this.state==='PICK'){if(e.pos>=n-1){this.state='DONE';this.running=false;this.msg='🎉 SELECTION SORT COMPLETE';return}e.min=e.pos;e.compare=e.pos+1;this.state='COMPARE';this.msg=`Pass ${e.pos+1}: compare ${this.array[e.compare]} with current minimum ${this.array[e.min]}.`;return}
  if(this.state==='COMPARE'){if(e.compare>=n){this.state='SWAP';this.msg=e.min===e.pos?`Minimum already at position ${e.pos}.`:`Place minimum ${this.array[e.min]} at position ${e.pos}.`;return}this.comparisons++;if(this.think&&!reveal){this.state='THINK';this.msg=`🤔 Is ${this.array[e.compare]} smaller than current minimum ${this.array[e.min]}?`;return}return this.selectionReveal(true)}
  if(this.state==='SWAP'){if(e.min!==e.pos){[this.array[e.pos],this.array[e.min]]=[this.array[e.min],this.array[e.pos]];this.swaps++;this.msg=`Swap minimum ${this.array[e.pos]} into position ${e.pos}.`}else this.msg=`${this.array[e.pos]} is already the minimum.`;e.pos++;this.state=e.pos>=n-1?'DONE':'PICK';if(this.state==='DONE'){this.running=false;this.msg='🎉 SELECTION SORT COMPLETE'}return}
 }
 selectionReveal(){const e=this.extra;if(e.compare>=this.array.length){this.state='SWAP';return}if(this.array[e.compare]<this.array[e.min]){e.min=e.compare;this.msg=`New minimum: ${this.array[e.min]}.`}else{this.msg=`${this.array[e.compare]} is not smaller than ${this.array[e.min]}.`}e.compare++;this.state='COMPARE'}
 mergeStep(reveal=false){const e=this.extra;if(this.state==='IDLE'){this.state='SPLITTING';e.treePhase='DIVIDE';this.msg='✂ DIVIDE: follow the array down the split tree.';return}if(this.state==='SPLITTING'){this.state='COMPARE';e.treePhase='CONQUER';this.msg='↗ CONQUER: merge the smallest sorted runs upward.';return}if(this.state==='THINK'&&!reveal)return this.mergeCompare(true);if(this.state==='COMPARE'){e.moveFrom=e.moveTo=-1;e.moveSource='';if(e.job>=e.jobs.length){this.state='DONE';this.running=false;this.msg='🎉 MERGE SORT COMPLETE';return}if(!e.left.length&&!e.right.length){[e.start,e.mid,e.end]=e.jobs[e.job];e.left=this.array.slice(e.start,e.mid);e.right=this.array.slice(e.mid,e.end);e.li=e.ri=0;e.merged=[];e.mergeNumber++;e.treeActive=e.job;e.treePhase='CONQUER';this.msg=`Merge ${e.mergeNumber}: ${e.left} + ${e.right}`;return}if(e.li>=e.left.length||e.ri>=e.right.length){return this.mergeMoveRemainder()}this.comparisons++;if(this.think&&!reveal){this.state='THINK';this.msg=`🤔 Which is smaller? ${e.left[e.li]} or ${e.right[e.ri]}?`;return}this.state='REVEAL';e.compareLeft=e.li;e.compareRight=e.ri;this.msg=`Compare ${e.left[e.li]} and ${e.right[e.ri]}`;return}if(this.state==='REVEAL'){return this.mergeCompare(true)}if(this.state==='MOVING'){this.state='COMPARE';return}}
 mergeCompare(){const e=this.extra;if(e.li>=e.left.length||e.ri>=e.right.length)return this.mergeMoveRemainder();const takeLeft=e.left[e.li]<=e.right[e.ri];const src=takeLeft?e.li:e.ri;const val=takeLeft?e.left[e.li++]:e.right[e.ri++];e.merged.push(val);e.moveSource=takeLeft?'LEFT RUN':'RIGHT RUN';e.moveFrom=src;e.moveTo=e.merged.length-1;e.movingValue=val;this.moves++;this.state='MOVING';this.msg=`Move ${val} from ${e.moveSource} into merged position ${e.moveTo}.`;if(e.li>=e.left.length&&e.ri>=e.right.length)this.completeMerge()}
 mergeMoveRemainder(){const e=this.extra;if(e.li<e.left.length){const val=e.left[e.li++];e.merged.push(val);e.moveSource='LEFT RUN';e.moveFrom=e.li-1;e.moveTo=e.merged.length-1;e.movingValue=val;this.moves++;this.state='MOVING';this.msg=`Move remaining ${val} from LEFT RUN into merged result.`}else if(e.ri<e.right.length){const val=e.right[e.ri++];e.merged.push(val);e.moveSource='RIGHT RUN';e.moveFrom=e.ri-1;e.moveTo=e.merged.length-1;e.movingValue=val;this.moves++;this.state='MOVING';this.msg=`Move remaining ${val} from RIGHT RUN into merged result.`}else this.completeMerge()}
 completeMerge(){const e=this.extra;this.array.splice(e.start,e.end-e.start,...e.merged);e.job++;e.left=[];e.right=[];e.merged=[];e.li=e.ri=0;e.moveFrom=e.moveTo=-1;e.moveSource='';this.state='COMPARE';this.msg=`Merge ${e.job} complete. The merged run replaces its old positions.`}
 quickStep(reveal=false){const e=this.extra;if(this.state==='IDLE'){this.state='STACK';this.msg='Quick Sort begins with the full array.';return}if(this.state==='THINK'&&!reveal)return this.quickCompare(true);if(this.state==='STACK'){if(!e.stack.length){this.state='DONE';this.running=false;this.msg='🎉 QUICK SORT COMPLETE';return}const [l,h]=e.stack.pop();e.low=l;e.high=h;if(l>=h){if(l===h)e.sorted.add(l);this.msg=`Range [${l}, ${h}] contains one element.`;return}e.pivotIndex=h;e.pivotValue=this.array[h];e.scan=l;e.boundary=l;e.stage='PIVOT';this.state='PIVOT';this.msg=`PIVOT = ${e.pivotValue}  •  active range [${l}, ${h}]`;return}if(this.state==='PIVOT'){if(e.stage==='PIVOT'){e.stage='SCAN';this.state='COMPARE';this.msg=`Scan index ${e.low}.`;return}if(e.stage==='PLACE'){this.placePivot();return}}if(this.state==='COMPARE'){if(this.think&&!reveal){this.state='THINK';this.msg=`🤔 Is ${this.array[e.scan]} ≤ ${e.pivotValue}?`;return}return this.quickCompare(true)}if(this.state==='SWAP'){return this.quickSwap()}if(this.state==='PARTITION_DONE'){this.createRanges();}}
 quickCompare(){const e=this.extra;if(e.scan>=e.high)return this.finishPartition();this.comparisons++;if(this.array[e.scan]<=e.pivotValue){if(e.scan!==e.boundary){this.current=[e.scan,e.boundary];this.state='SWAP';this.msg=`Move ${this.array[e.scan]} left of pivot.`;return}e.boundary++;e.scan++;this.state='COMPARE';return}e.scan++;this.state='COMPARE';this.msg=`${this.array[e.scan-1]} stays right of pivot.`}
 quickSwap(){const e=this.extra;[this.array[e.scan],this.array[e.boundary]]=[this.array[e.boundary],this.array[e.scan]];this.swaps++;e.boundary++;e.scan++;this.state='COMPARE';this.msg='Swap complete; continue partitioning.'}
 finishPartition(){const e=this.extra;e.stage='PLACE';this.state='PIVOT';this.msg=`Place pivot ${e.pivotValue} at index ${e.boundary}.`}
 placePivot(){const e=this.extra;if(e.boundary!==e.high){[this.array[e.boundary],this.array[e.high]]=[this.array[e.high],this.array[e.boundary]];this.swaps++}e.pivotIndex=e.boundary;e.sorted.add(e.boundary);this.state='PARTITION_DONE';this.msg=`🎯 Pivot ${e.pivotValue} fixed at index ${e.boundary}.`}
 createRanges(){const e=this.extra;e.stack.push([e.low,e.pivotIndex-1]);e.stack.push([e.pivotIndex+1,e.high]);e.stage='NONE';this.state='STACK';this.msg='Pivot fixed. New sub-arrays added to stack.'}
 heapStep(reveal=false){const e=this.extra;if(this.state==='IDLE'){e.sub='BUILD';e.buildIndex=Math.floor(this.array.length/2)-1;this.state='BUILDING';this.msg=`Building ${e.mode} HEAP...`;return}if(this.state==='BUILDING'){if(e.buildIndex<0){e.heapSize=this.array.length;e.sub='EXTRACT';this.state='EXTRACT';this.msg=`${e.mode} heap built. Extract root.`;return}e.heapifyCount++;e.node=e.buildIndex;this.state='COMPARE';this.msg=`Heapify node ${e.buildIndex} for ${e.mode} heap.`;e.buildIndex--;return}if(this.state==='EXTRACT'){if(e.heapSize<=1){this.state='DONE';this.running=false;this.msg='🎉 HEAP SORT COMPLETE';return}e.moveFrom=0;e.moveTo=e.heapSize-1;e.movingValue=this.array[0];[this.array[0],this.array[e.heapSize-1]]=[this.array[e.heapSize-1],this.array[0]];this.swaps++;e.heapSize--;e.node=0;this.state='HEAPIFY';this.msg=`Move root ${e.movingValue} to the sorted end, then heapify.`;return}if(this.state==='THINK'){if(!reveal)return;this.state='COMPARE';return this.heapifyOne()}if(this.state==='COMPARE'&&this.think&&!reveal){this.state='THINK';this.msg=e.mode==='MAX'?'🤔 Choose the larger child.':'🤔 Choose the smaller child.';return}if(this.state==='HEAPIFY'||this.state==='COMPARE'){return this.heapifyOne()}}
 heapifyOne(){const e=this.extra,n=e.heapSize,i=e.node;let chosen=i,l=2*i+1,r=2*i+2;e.compareNode=[i,l<n?l:-1,r<n?r:-1];if(l<n){this.comparisons++;if(e.mode==='MAX'?this.array[l]>this.array[chosen]:this.array[l]<this.array[chosen])chosen=l}if(r<n){this.comparisons++;if(e.mode==='MAX'?this.array[r]>this.array[chosen]:this.array[r]<this.array[chosen])chosen=r}e.largest=chosen;if(chosen!==i){e.moveFrom=i;e.moveTo=chosen;e.movingValue=this.array[chosen];[this.array[i],this.array[chosen]]=[this.array[chosen],this.array[i]];this.swaps++;e.node=chosen;this.state='HEAPIFY';this.msg=`Swap ${this.array[chosen]} with ${e.mode==='MAX'?'larger':'smaller'} child.`}else{e.moveFrom=e.moveTo=-1;if(e.sub==='BUILD'){this.state='BUILDING';this.msg='Heapify step complete.'}else{this.state='EXTRACT';this.msg='Heap restored; extract next root.'}}}
 countingStep(reveal=false){const e=this.extra,n=this.array.length;if(this.state==='IDLE'){this.state='COUNTING';e.idx=0;e.value=this.array[0];this.msg=`Reading value ${e.value}...`;return}if(this.state==='THINK'&&!reveal)return this.countApply();if(this.state==='COUNTING'){if(e.idx>=n){this.state='PREFIX';e.idx=0;this.msg='Now calculate cumulative counts.';return}e.value=this.array[e.idx];if(this.think&&!reveal){this.state='THINK';this.msg=`🤔 What happens to count[${e.value}]?`;return}this.state='REVEAL';this.msg=`Value ${e.value} found → increase its count.`;return}if(this.state==='REVEAL')return this.countApply();if(this.state==='PREFIX'){if(e.idx>=e.counts.length){this.state='PLACING';e.idx=n-1;this.msg='Now place each value into its correct position.';return}e.prefix[e.idx]=e.idx===0?e.counts[e.idx]:e.prefix[e.idx-1]+e.counts[e.idx];this.moves++;e.idx++;this.msg=`Prefix[${e.min+e.idx-1}] = ${e.prefix[e.idx-1]}`;return}if(this.state==='PLACING'){if(e.idx<0){this.array=clone(e.output);this.state='DONE';this.running=false;this.msg='🎉 COUNTING SORT COMPLETE';return}const v=this.array[e.idx],p=v-e.min,d=Math.max(0,Math.min(e.prefix[p]-1,n-1));e.output[d]=v;e.prefix[p]--;this.moves++;this.comparisons++;e.idx--;this.msg=`${v} → output position ${d}`;return}}
 countApply(){const e=this.extra;if(this.state==='THINK'&&this.think){/* reveal is explicit */}const p=e.value-e.min;e.counts[p]++;this.comparisons++;e.idx++;this.state='COUNTING';this.msg=`Count[${e.value}] = ${e.counts[p]}`}
 radixStep(reveal=false){const e=this.extra;if(this.state==='IDLE'){e.place=1;e.idx=0;e.passes=1;e.buckets=Array.from({length:10},()=>[]);e.liveArray=clone(this.array);this.state='READING';this.msg=`Pass ${e.passes}: sorting by ones digit.`;return}if(this.state==='THINK'&&!reveal)return this.radixPlace();if(this.state==='READING'){if(e.idx>=this.array.length){this.state='COLLECTING';e.collectBucket=0;e.output=[];this.msg='All numbers are in buckets. Collect 0 → 9.';return}e.num=this.array[e.idx];e.bucket=Math.floor(e.num/e.place)%10;this.comparisons++;if(this.think&&!reveal){this.state='THINK';this.msg=`🤔 ${e.num}: which bucket contains its digit?`;return}this.state='BUCKETING';this.msg=`${e.num} → Bucket ${e.bucket}`;return}if(this.state==='BUCKETING')return this.radixPlace();if(this.state==='COLLECTING'){while(e.collectBucket<10&&e.buckets[e.collectBucket].length===0)e.collectBucket++;if(e.collectBucket>=10){this.array=clone(e.output);e.liveArray=clone(this.array);if(e.place<e.maxPlace){e.place*=10;e.passes++;e.idx=0;e.num=null;e.bucket=null;e.digitLabel=e.place===10?'TENS':e.place===100?'HUNDREDS':`${e.place}s`;e.buckets=Array.from({length:10},()=>[]);e.output=[];e.liveArray=clone(this.array);e.collectBucket=0;e.moveKind='PASS_COMPLETE';this.state='READING';this.msg=`Pass ${e.passes-1} complete. The rebuilt bars become the input for ${e.digitLabel}.`;return}this.state='DONE';this.running=false;this.msg='🎉 RADIX SORT COMPLETE';return}const source=e.buckets[e.collectBucket];const v=source.shift();e.moveFrom=-1;e.moveTo=e.output.length;e.movingValue=v;e.moveKind='COLLECT';e.output.push(v);e.liveArray[e.output.length-1]=v;this.moves++;this.msg=`Throw ${v} from Bucket ${e.collectBucket} into rebuilt bar ${e.output.length-1}.`;return}}
 radixPlace(){const e=this.extra;e.moveFrom=e.idx;e.moveTo=e.bucket;e.movingValue=e.num;e.buckets[e.bucket].push(e.num);e.liveArray[e.idx]=null;this.moves++;e.idx++;e.num=null;e.bucket=null;this.state='READING';this.msg='Move to next number.'}
 bucketStep(reveal=false){const e=this.extra;if(this.state==='IDLE'){this.makeBuckets();e.idx=0;e.buckets=Array.from({length:e.bucketCount},()=>[]);this.state='DISTRIBUTE';this.msg='Distributing values into their ranges...';return}if(this.state==='THINK'&&!reveal)return this.bucketReveal();if(this.state==='DISTRIBUTE'){if(e.idx>=this.array.length){e.sortBucket=0;e.sortIndex=1;this.state='SORTING';this.msg='All values are distributed. Now sort each bucket.';return}const v=this.array[e.idx],i=this.bucketIndex(v);e.moveFrom=e.idx;e.moveTo=i;e.movingValue=v;e.moveKind='DISTRIBUTE';e.buckets[i].push(v);e.liveArray[e.idx]=null;this.moves++;e.idx++;this.msg=`Throw ${v} from live bar ${e.idx-1} → Bucket ${i+1}`;return}if(this.state==='SORTING'){if(e.sortBucket>=e.buckets.length){this.state='COLLECT';e.idx=0;e.result=[];this.msg='All buckets sorted. Collecting left to right.';return}const b=e.buckets[e.sortBucket];if(b.length<=1||e.sortIndex>=b.length){e.sortBucket++;e.sortIndex=1;return}this.comparisons++;if(this.think&&!reveal){this.state='THINK';this.msg=`🤔 Compare ${b[e.sortIndex-1]} and ${b[e.sortIndex]}`;return}this.state='REVEAL';this.msg=`Compare ${b[e.sortIndex-1]} and ${b[e.sortIndex]}`;return}if(this.state==='REVEAL')return this.bucketReveal();if(this.state==='COLLECT'){let flat=e.buckets.flat();if(e.idx>=flat.length){this.array=clone(e.result);e.liveArray=clone(this.array);this.state='DONE';this.running=false;this.msg='🎉 BUCKET SORT COMPLETE';return}const v=flat[e.idx];e.moveFrom=-1;e.moveTo=e.result.length;e.movingValue=v;e.moveKind='COLLECT';e.result.push(v);e.liveArray[e.result.length-1]=v;e.idx++;this.moves++;this.msg=`Throw ${v} from bucket sequence → live bar ${e.result.length-1}`;}}
 bucketIndex(v){const min=Math.min(...this.array),max=Math.max(...this.array);if(max===min)return 0;let i=Math.floor(((v-min)*this.extra.bucketCount)/(max-min+1));return Math.max(0,Math.min(i,this.extra.bucketCount-1))}
 bucketReveal(){const e=this.extra,b=e.buckets[e.sortBucket];if(e.sortIndex<=0||e.sortIndex>=b.length){e.sortBucket++;e.sortIndex=1;this.state='SORTING';return}const a=b[e.sortIndex-1],c=b[e.sortIndex];if(c<a){e.moveFrom=e.sortIndex;e.moveTo=e.sortIndex-1;e.movingValue=c;e.moveKind='SWAP';[b[e.sortIndex-1],b[e.sortIndex]]=[b[e.sortIndex],b[e.sortIndex-1]];this.swaps++;this.state='SORTING';e.sortIndex=Math.max(1,e.sortIndex-1);this.msg=`Swap ${c} and ${a}.`}else{this.state='SORTING';e.sortIndex++;this.msg=`${c} is already in the correct position.`}}
 newArray(){let n=this.array.length;let a=[];if(this.type==='radix')for(let i=0;i<7;i++)a.push(10+Math.floor(Math.random()*990));else if(this.type==='quick')for(let i=0;i<8;i++)a.push(10+Math.floor(Math.random()*90));else if(this.type==='bubble')for(let i=0;i<10;i++)a.push(10+Math.floor(Math.random()*90));else if(this.type==='counting')for(let i=0;i<10;i++)a.push(1+Math.floor(Math.random()*7));else for(let i=0;i<n;i++)a.push(10+Math.floor(Math.random()*90));this.defaultArray=a;this.reset();this.array=clone(a);this.defaultArray=clone(a);if(this.type==='counting'){const min=Math.min(...a),max=Math.max(...a);this.extra.min=min;this.extra.max=max;this.extra.counts=Array(max-min+1).fill(0);this.extra.prefix=Array(max-min+1).fill(0);this.extra.output=Array(a.length).fill(null)}}
 setCustomArray(values){const a=values.slice();if(!a.length)throw new Error('Enter at least one number.');if(a.length>30)throw new Error('Please keep the array to 30 elements or fewer for clear live visualization.');if(a.some(v=>!Number.isInteger(v)))throw new Error('Use integers only.');if(this.type==='radix'&&a.some(v=>v<0))throw new Error('Radix Sort in this lab accepts non-negative integers only.');this.running=false;this.array=clone(a);this.defaultArray=clone(a);this.state='IDLE';this.msg='Custom array loaded. Press PLAY or STEP to begin.';this.comparisons=0;this.swaps=0;this.moves=0;this.phase='READY';this.current=null;this.initSpecific();}
}

const LEARNING_DATA={
  "info": {
    "bubble": {
      "title": "Bubble Sort",
      "idea": "Repeatedly compare adjacent values. If the pair is out of order, swap it. After each pass, the largest remaining value settles at the right end.",
      "use": "Teaching, tiny datasets, nearly-sorted lists, and situations where implementation simplicity matters more than speed.",
      "avoid": "Large datasets; it performs quadratic work in the average and worst cases.",
      "properties": "Stable • In-place • Comparison sort",
      "complexity": "Best O(n) with an early-exit optimization; average/worst O(n²); space O(1)."
    },
    "insertion": {
      "title": "Insertion Sort",
      "idea": "Grow a sorted prefix one element at a time. Pick the next key, shift larger prefix values one position right, and insert the key into the gap.",
      "use": "Small arrays, nearly-sorted data, online insertion, and as the small-partition base case inside faster hybrid sorts.",
      "avoid": "Large random datasets where quadratic shifting dominates.",
      "properties": "Stable • In-place • Adaptive • Online",
      "complexity": "Best O(n); average/worst O(n²); space O(1)."
    },
    "selection": {
      "title": "Selection Sort",
      "idea": "Scan the unsorted region, remember the smallest value, then swap it into the next sorted position. The number of swaps is small even though comparisons remain quadratic.",
      "use": "Very small datasets or systems where minimizing writes/swaps is more important than minimizing comparisons.",
      "avoid": "Large datasets; it always performs Θ(n²) comparisons.",
      "properties": "Usually not stable • In-place • Low writes",
      "complexity": "Best/average/worst O(n²); space O(1)."
    },
    "merge": {
      "title": "Merge Sort",
      "idea": "Divide the array into smaller contiguous runs until single-element runs remain. Then conquer by repeatedly merging two sorted runs into one larger sorted run.",
      "use": "Large datasets, linked lists, external sorting, stable sorting requirements, and predictable O(n log n) performance.",
      "avoid": "Memory-constrained in-place scenarios unless a specialized in-place merge implementation is used.",
      "properties": "Stable • Predictable • Usually not in-place for arrays",
      "complexity": "Best/average/worst O(n log n); auxiliary space O(n) for the standard array implementation."
    },
    "quick": {
      "title": "Quick Sort",
      "idea": "Choose a pivot, partition the active range so values on one side satisfy the pivot rule, then recursively sort the two partitions. This lab uses the last element as pivot.",
      "use": "General-purpose in-memory sorting, especially when cache locality and low auxiliary memory are valuable.",
      "avoid": "Adversarial inputs with poor pivots unless randomized/median-style pivot selection or introspective safeguards are used.",
      "properties": "In-place partitioning • Usually unstable • Excellent practical locality",
      "complexity": "Average/best O(n log n); worst O(n²); stack space is typically O(log n) with balanced recursion."
    },
    "heap": {
      "title": "Heap Sort",
      "idea": "Build a heap, repeatedly move the root to the sorted suffix, then restore the heap property. The live tree shows parent/child relationships during heapify.",
      "use": "When worst-case O(n log n) time and O(1) auxiliary array space are important.",
      "avoid": "Situations where stable ordering or best practical cache performance is required.",
      "properties": "In-place • Unstable • Guaranteed O(n log n)",
      "complexity": "Best/average/worst O(n log n); auxiliary space O(1) for iterative array implementations."
    },
    "counting": {
      "title": "Counting Sort",
      "idea": "Count how often each integer occurs, convert counts to prefix positions, then place values into the output. It avoids pairwise comparisons.",
      "use": "Integers or small categorical keys with a manageable value range, such as grades, ages, bounded IDs, and histogram-like data.",
      "avoid": "Huge key ranges compared with n, or arbitrary non-integer keys.",
      "properties": "Stable when implemented with prefix placement • Non-comparison",
      "complexity": "O(n + k) time and O(n + k) space for the standard stable version, where k is the key range."
    },
    "radix": {
      "title": "Radix Sort",
      "idea": "Process one digit position at a time, usually from least significant to most significant, using a stable bucket/counting pass. This lab visualizes ONES, TENS, HUNDREDS and beyond.",
      "use": "Large collections of fixed-width integers, IDs, ZIP-like codes, timestamps, and strings when digit/key width is bounded.",
      "avoid": "Highly irregular keys, expensive digit extraction, or cases where the digit count is large compared with comparison sorting.",
      "properties": "Non-comparison • Stable with stable digit pass • Digit/key dependent",
      "complexity": "O(d·(n+b)) for base b; this lab uses b=10, so approximately O(d·n)."
    },
    "bucket": {
      "title": "Bucket Sort",
      "idea": "Map values into value-range buckets, sort each bucket, then concatenate the buckets in order. This lab uses insertion-style sorting inside each bucket.",
      "use": "Data that is approximately uniformly distributed over a known numeric range, including normalized floating-point values.",
      "avoid": "Highly skewed distributions that overload one bucket, or unknown/wildly varying ranges.",
      "properties": "Distribution sort • Stable only if the inner sort is stable • Extra space",
      "complexity": "Expected O(n+k) under favorable distribution assumptions; worst case can approach O(n²) with insertion-style bucket sorting."
    }
  },
  "languages": [
    "C",
    "C++",
    "Python",
    "Java",
    "JavaScript"
  ],
  "codes": {
    "bubble": {
      "C": "void bubbleSort(int a[], int n) {\n    for (int i = 0; i < n - 1; ++i) {\n        int swapped = 0;\n        for (int j = 0; j < n - i - 1; ++j) {\n            if (a[j] > a[j + 1]) {\n                int t = a[j];\n                a[j] = a[j + 1];\n                a[j + 1] = t;\n                swapped = 1;\n            }\n        }\n        if (!swapped) {\n            break;\n        }\n    }\n}",
      "C++": "void bubbleSort(vector<int>& a) {\n    for (int i = 0; i + 1 < a.size(); ++i) {\n        bool swapped = false;\n        for (int j = 0; j + 1 < (int)a.size() - i; ++j)\n        if (a[j] > a[j+1]) {\n            swap(a[j], a[j+1]);\n            swapped = true;\n        }\n        if (!swapped) {\n            break;\n        }\n    }\n}",
      "Python": "def bubble_sort(a):\n    a = a[:]\n    n = len(a)\n    for i in range(n - 1):\n        swapped = False\n        for j in range(n - i - 1):\n            if a[j] > a[j + 1]:\n                a[j], a[j + 1] = a[j + 1], a[j]\n                swapped = True\n        if not swapped:\n            break\n    return a",
      "Java": "static void bubbleSort(int[] a) {\n    for (int i = 0; i < a.length - 1; i++) {\n        boolean swapped = false;\n        for (int j = 0; j < a.length - i - 1; j++)\n        if (a[j] > a[j+1]) {\n            int t=a[j];\n            a[j]=a[j+1];\n            a[j+1]=t;\n            swapped=true;\n        }\n        if (!swapped) {\n            break;\n        }\n    }\n}",
      "JavaScript": "function bubbleSort(a) {\n    for (let i=0; i<a.length-1; i++) {\n        let swapped=false;\n        for (let j=0; j<a.length-i-1; j++)\n        if (a[j]>a[j+1]) {\n            [a[j],a[j+1]]=[a[j+1],a[j]];\n            swapped=true;\n        }\n        if (!swapped) {\n            break;\n        }\n    }\n    return a;\n}"
    },
    "insertion": {
      "C": "void insertionSort(int a[], int n) {\n    for (int i=1; i<n; ++i) {\n        int key=a[i], j=i-1;\n        while (j>=0 && a[j]>key) {\n            a[j+1]=a[j];\n            --j;\n        }\n        a[j+1]=key;\n    }\n}",
      "C++": "void insertionSort(vector<int>& a) {\n    for (int i=1; i<(int)a.size(); ++i) {\n        int key=a[i], j=i-1;\n        while (j>=0 && a[j]>key) {\n            a[j+1]=a[j];\n            --j;\n        }\n        a[j+1]=key;\n    }\n}",
      "Python": "def insertion_sort(a):\n    a = a[:]\n    for i in range(1, len(a)):\n        key = a[i]\n        j = i - 1\n        while j >= 0 and a[j] > key:\n            a[j + 1] = a[j]\n            j -= 1\n        a[j + 1] = key\n    return a",
      "Java": "static void insertionSort(int[] a) {\n    for (int i=1;i<a.length;i++) {\n        int key=a[i],j=i-1;\n        while(j>=0 && a[j]>key) {\n            a[j+1]=a[j];\n            j--;\n        }\n        a[j+1]=key;\n    }\n}",
      "JavaScript": "function insertionSort(a) {\n    for(let i=1;i<a.length;i++) {\n        let key=a[i],j=i-1;\n        while(j>=0&&a[j]>key) {\n            a[j+1]=a[j];\n            j--;\n        }\n        a[j+1]=key;\n    }\n    return a;\n}"
    },
    "selection": {
      "C": "void selectionSort(int a[], int n) {\n    for (int i=0;i<n-1;i++) {\n        int m=i;\n        for (int j=i+1;j<n;j++) {\n            if(a[j]<a[m]) {\n                m=j;\n            }\n        }\n        if(m!=i) {\n            int t=a[i];\n            a[i]=a[m];\n            a[m]=t;\n        }\n    }\n}",
      "C++": "void selectionSort(vector<int>& a) {\n    for(int i=0;i+1<(int)a.size();i++) {\n        int m=i;\n        for(int j=i+1;j<(int)a.size();j++) {\n            if(a[j]<a[m]) {\n                m=j;\n            }\n        }\n        if(m!=i) {\n            swap(a[i],a[m]);\n        }\n    }\n}",
      "Python": "def selection_sort(a):\n    a = a[:]\n    n = len(a)\n    for i in range(n - 1):\n        min_index = i\n        for j in range(i + 1, n):\n            if a[j] < a[min_index]:\n                min_index = j\n        if min_index != i:\n            a[i], a[min_index] = a[min_index], a[i]\n    return a",
      "Java": "static void selectionSort(int[] a) {\n    for(int i=0;i<a.length-1;i++) {\n        int m=i;\n        for(int j=i+1;j<a.length;j++) {\n            if(a[j]<a[m]) {\n                m=j;\n            }\n        }\n        int t=a[i];\n        a[i]=a[m];\n        a[m]=t;\n    }\n}",
      "JavaScript": "function selectionSort(a) {\n    for(let i=0;i<a.length-1;i++) {\n        let m=i;\n        for(let j=i+1;j<a.length;j++) {\n            if(a[j]<a[m]) {\n                m=j;\n            }\n        }\n        [a[i],a[m]]=[a[m],a[i]];\n    }\n    return a;\n}"
    },
    "merge": {
      "C": "void merge(int a[],int l,int m,int r) {\n    int n1=m-l,n2=r-m,i=0,j=0,k=l;\n    int L[100],R[100];\n    for(i=0;i<n1;i++) {\n        L[i]=a[l+i];\n    }\n    for(j=0;j<n2;j++) {\n        R[j]=a[m+j];\n    }\n    i=j=0;\n    while(i<n1&&j<n2) {\n        a[k++]=(L[i]<=R[j]?L[i++]:R[j++]);\n    }\n    while(i<n1) {\n        a[k++]=L[i++];\n    }\n    while(j<n2) {\n        a[k++]=R[j++];\n    }\n}\nvoid mergeSort(int a[],int l,int r) {\n    if(r-l<=1) {\n        return;\n    }\n    int m=(l+r)/2;\n    mergeSort(a,l,m);\n    mergeSort(a,m,r);\n    merge(a,l,m,r);\n}",
      "C++": "void mergeSort(vector<int>& a,int l,int r) {\n    if(r-l<=1) {\n        return;\n    }\n    int m=(l+r)/2;\n    mergeSort(a,l,m);\n    mergeSort(a,m,r);\n    vector<int> t;\n    int i=l,j=m;\n    while(i<m&&j<r) {\n        t.push_back(a[i]<=a[j]?a[i++]:a[j++]);\n    }\n    while(i<m) {\n        t.push_back(a[i++]);\n    }\n    while(j<r) {\n        t.push_back(a[j++]);\n    }\n    copy(t.begin(),t.end(),a.begin()+l);\n}",
      "Python": "def merge_sort(a):\n    if len(a) <= 1:\n        return a[:]\n\n    mid = len(a) // 2\n    left = merge_sort(a[:mid])\n    right = merge_sort(a[mid:])\n    merged = []\n    i = j = 0\n\n    while i < len(left) and j < len(right):\n        if left[i] <= right[j]:\n            merged.append(left[i])\n            i += 1\n        else:\n            merged.append(right[j])\n            j += 1\n\n    merged.extend(left[i:])\n    merged.extend(right[j:])\n    return merged",
      "Java": "static void mergeSort(int[] a,int l,int r) {\n    if(r-l<=1) {\n        return;\n    }\n    int m=(l+r)/2;\n    mergeSort(a,l,m);\n    mergeSort(a,m,r);\n    int[] t=new int[r-l];\n    int i=l,j=m,k=0;\n    while(i<m&&j<r) {\n        t[k++]=a[i]<=a[j]?a[i++]:a[j++];\n    }\n    while(i<m) {\n        t[k++]=a[i++];\n    }\n    while(j<r) {\n        t[k++]=a[j++];\n    }\n    System.arraycopy(t,0,a,l,t.length);\n}",
      "JavaScript": "function mergeSort(a) {\n    if(a.length<2) {\n        return a;\n    }\n    const m=a.length>>1,L=mergeSort(a.slice(0,m)),R=mergeSort(a.slice(m)),o=[];\n    while(L.length&&R.length) {\n        o.push(L[0]<=R[0]?L.shift():R.shift());\n    }\n    return o.concat(L,R);\n}"
    },
    "quick": {
      "C": "int partition(int a[],int l,int r) {\n    int p=a[r],i=l;\n    for(int j=l;j<r;j++)if(a[j]<=p) {\n        int t=a[i];\n        a[i]=a[j];\n        a[j]=t;\n        i++;\n    }\n    int t=a[i];\n    a[i]=a[r];\n    a[r]=t;\n    return i;\n}\nvoid quickSort(int a[],int l,int r) {\n    if(l<r) {\n        int p=partition(a,l,r);\n        quickSort(a,l,p-1);\n        quickSort(a,p+1,r);\n    }\n}",
      "C++": "int partition(vector<int>&a,int l,int r) {\n    int p=a[r],i=l;\n    for(int j=l;j<r;j++) {\n        if(a[j]<=p) {\n            swap(a[i++],a[j]);\n        }\n    }\n    swap(a[i],a[r]);\n    return i;\n}\nvoid quickSort(vector<int>&a,int l,int r) {\n    if(l<r) {\n        int p=partition(a,l,r);\n        quickSort(a,l,p-1);\n        quickSort(a,p+1,r);\n    }\n}",
      "Python": "def quick_sort(a):\n    if len(a) <= 1:\n        return a[:]\n\n    pivot = a[-1]\n    left = [value for value in a[:-1] if value <= pivot]\n    right = [value for value in a[:-1] if value > pivot]\n    return quick_sort(left) + [pivot] + quick_sort(right)",
      "Java": "static void quickSort(int[]a,int l,int r) {\n    if(l>=r) {\n        return;\n    }\n    int p=a[r],i=l;\n    for(int j=l;j<r;j++)if(a[j]<=p) {\n        int t=a[i];\n        a[i++]=a[j];\n        a[j]=t;\n    }\n    int t=a[i];\n    a[i]=a[r];\n    a[r]=t;\n    quickSort(a,l,i-1);\n    quickSort(a,i+1,r);\n}",
      "JavaScript": "function quickSort(a) {\n    if(a.length<2) {\n        return a;\n    }\n    const p=a.at(-1),L=a.slice(0,-1).filter(x=>x<=p),R=a.slice(0,-1).filter(x=>x>p);\n    return [...quickSort(L),p,...quickSort(R)];\n}"
    },
    "heap": {
      "C": "void heapSort(int a[],int n) {\n    for(int i=n/2-1;i>=0;i--)for(int r=i;;) {\n        int c=2*r+1;\n        if(c>=n) {\n            break;\n        }\n        if(c+1<n&&a[c+1]>a[c]) {\n            c++;\n        }\n        if(a[r]>=a[c]) {\n            break;\n        }\n        int t=a[r];\n        a[r]=a[c];\n        a[c]=t;\n        r=c;\n    }\n    for(int end=n-1;end>0;end--) {\n        int t=a[0];\n        a[0]=a[end];\n        a[end]=t;\n        /* heapify [0,end) */ for(int r=0;;) {\n            int c=2*r+1;\n            if(c>=end) {\n                break;\n            }\n            if(c+1<end&&a[c+1]>a[c]) {\n                c++;\n            }\n            if(a[r]>=a[c]) {\n                break;\n            }\n            t=a[r];\n            a[r]=a[c];\n            a[c]=t;\n            r=c;\n        }\n    }\n}",
      "C++": "void heapSort(vector<int>&a) {\n    auto down=[&](int n,int r) {\n        for(;;) {\n            int c=2*r+1;\n            if(c>=n) {\n                return;\n            }\n            if(c+1<n&&a[c+1]>a[c]) {\n                c++;\n            }\n            if(a[r]>=a[c]) {\n                return;\n            }\n            swap(a[r],a[c]);\n            r=c;\n        }\n    };\n    for(int i=a.size()/2-1;i>=0;i--) {\n        down(a.size(),i);\n    }\n    for(int e=a.size()-1;e>0;e--) {\n        swap(a[0],a[e]);\n        down(e,0);\n    }\n}",
      "Python": "def heap_sort(a):\n    a = a[:]\n    n = len(a)\n\n    def sift_down(root, end):\n        while 2 * root + 1 < end:\n            child = 2 * root + 1\n            if child + 1 < end and a[child] < a[child + 1]:\n                child += 1\n            if a[root] >= a[child]:\n                return\n            a[root], a[child] = a[child], a[root]\n            root = child\n\n    for root in range(n // 2 - 1, -1, -1):\n        sift_down(root, n)\n\n    for end in range(n - 1, 0, -1):\n        a[0], a[end] = a[end], a[0]\n        sift_down(0, end)\n    return a",
      "Java": "static void heapSort(int[]a) {\n    for(int i=a.length/2-1;i>=0;i--) {\n        down(a,a.length,i);\n    }\n    for(int e=a.length-1;e>0;e--) {\n        int t=a[0];\n        a[0]=a[e];\n        a[e]=t;\n        down(a,e,0);\n    }\n}\nstatic void down(int[]a,int n,int i) {\n    while(true) {\n        int c=2*i+1;\n        if(c>=n) {\n            return;\n        }\n        if(c+1<n&&a[c+1]>a[c]) {\n            c++;\n        }\n        if(a[i]>=a[c]) {\n            return;\n        }\n        int t=a[i];\n        a[i]=a[c];\n        a[c]=t;\n        i=c;\n    }\n}",
      "JavaScript": "function heapSort(a) {\n    const down=(n,i)=> {\n        for(;;) {\n            let c=2*i+1;\n            if(c>=n) {\n                return;\n            }\n            if(c+1<n&&a[c+1]>a[c]) {\n                c++;\n            }\n            if(a[i]>=a[c]) {\n                return;\n            }\n            [a[i],a[c]]=[a[c],a[i]];\n            i=c;\n        }\n    };\n    for(let i=(a.length>>1)-1;i>=0;i--) {\n        down(a.length,i);\n    }\n    for(let e=a.length-1;e>0;e--) {\n        [a[0],a[e]]=[a[e],a[0]];\n        down(e,0);\n    }\n    return a;\n}"
    },
    "counting": {
      "C": "void countingSort(int a[],int n,int k) {\n    int c[100]= {\n        0\n    },out[100];\n    for(int i=0;i<n;i++) {\n        c[a[i]]++;\n    }\n    for(int i=1;i<k;i++) {\n        c[i]+=c[i-1];\n    }\n    for(int i=n-1;i>=0;i--) {\n        out[--c[a[i]]]=a[i];\n    }\n    for(int i=0;i<n;i++) {\n        a[i]=out[i];\n    }\n}",
      "C++": "void countingSort(vector<int>&a,int k) {\n    vector<int>c(k),o(a.size());\n    for(int x:a) {\n        c[x]++;\n    }\n    for(int i=1;i<k;i++) {\n        c[i]+=c[i-1];\n    }\n    for(int i=a.size()-1;i>=0;i--) {\n        o[--c[a[i]]]=a[i];\n    }\n    a=o;\n}",
      "Python": "def counting_sort(a):\n    if not a:\n        return []\n\n    low, high = min(a), max(a)\n    counts = [0] * (high - low + 1)\n    for value in a:\n        counts[value - low] += 1\n\n    result = []\n    for offset, count in enumerate(counts):\n        result.extend([low + offset] * count)\n    return result",
      "Java": "static int[] countingSort(int[]a,int k) {\n    int[]c=new int[k],o=new int[a.length];\n    for(int x:a) {\n        c[x]++;\n    }\n    for(int i=1;i<k;i++) {\n        c[i]+=c[i-1];\n    }\n    for(int i=a.length-1;i>=0;i--) {\n        o[--c[a[i]]]=a[i];\n    }\n    return o;\n}",
      "JavaScript": "function countingSort(a) {\n    const lo=Math.min(...a),hi=Math.max(...a),c=Array(hi-lo+1).fill(0);\n    for(const x of a) {\n        c[x-lo]++;\n    }\n    const o=[];\n    c.forEach((n,i)=> {\n        for(let j=0;j<n;j++)o.push(i+lo)\n    });\n    return o;\n}"
    },
    "radix": {
      "C": "void radixSort(int a[],int n) {\n    int out[100],max=a[0];\n    for(int i=1;i<n;i++) {\n        if(a[i]>max) {\n            max=a[i];\n        }\n    }\n    for(int exp=1;max/exp>0;exp*=10) {\n        int c[10]= {\n            0\n        };\n        for(int i=0;i<n;i++) {\n            c[(a[i]/exp)%10]++;\n        }\n        for(int i=1;i<10;i++) {\n            c[i]+=c[i-1];\n        }\n        for(int i=n-1;i>=0;i--) {\n            out[--c[(a[i]/exp)%10]]=a[i];\n        }\n        for(int i=0;i<n;i++) {\n            a[i]=out[i];\n        }\n    }\n}",
      "C++": "void radixSort(vector<int>&a) {\n    int m=*max_element(a.begin(),a.end());\n    for(int e=1;m/e;e*=10) {\n        vector<int>c(10),o(a.size());\n        for(int x:a) {\n            c[(x/e)%10]++;\n        }\n        for(int i=1;i<10;i++) {\n            c[i]+=c[i-1];\n        }\n        for(int i=a.size()-1;i>=0;i--) {\n            o[--c[(a[i]/e)%10]]=a[i];\n        }\n        a=o;\n    }\n}",
      "Python": "def radix_sort(a):\n    if not a:\n        return []\n    if any(value < 0 for value in a):\n        raise ValueError(\"This example expects non-negative integers\")\n\n    result = a[:]\n    exp = 1\n    while max(result) // exp > 0:\n        buckets = [[] for _ in range(10)]\n        for value in result:\n            digit = (value // exp) % 10\n            buckets[digit].append(value)\n        result = [value for bucket in buckets for value in bucket]\n        exp *= 10\n    return result",
      "Java": "static void radixSort(int[]a) {\n    int m=Arrays.stream(a).max().orElse(0);\n    for(int e=1;m/e>0;e*=10) {\n        int[]c=new int[10],o=new int[a.length];\n        for(int x:a) {\n            c[(x/e)%10]++;\n        }\n        for(int i=1;i<10;i++) {\n            c[i]+=c[i-1];\n        }\n        for(int i=a.length-1;i>=0;i--) {\n            o[--c[(a[i]/e)%10]]=a[i];\n        }\n        a=o;\n    }\n}",
      "JavaScript": "function radixSort(a) {\n    for(let e=1;Math.floor(Math.max(...a)/e)>0;e*=10) {\n        const b=Array.from( {\n            length:10\n        },()=>[]);\n        for(const x of a) {\n            b[Math.floor(x/e)%10].push(x);\n        }\n        a=b.flat();\n    }\n    return a;\n}"
    },
    "bucket": {
      "C": "void bucketSort(float a[],int n) {\n    float b[10][100];\n    int sz[10]= {\n        0\n    };\n    for(int i=0;i<n;i++) {\n        int k=(int)(a[i]*10);\n        b[k][sz[k]++]=a[i];\n    }\n    for(int k=0;k<10;k++)for(int i=1;i<sz[k];i++) {\n        float x=b[k][i];\n        int j=i-1;\n        while(j>=0&&b[k][j]>x) {\n            b[k][j+1]=b[k][j];\n            j--;\n        }\n        b[k][j+1]=x;\n    }\n    /* collect */int p=0;\n    for(int k=0;k<10;k++) {\n        for(int i=0;i<sz[k];i++) {\n            a[p++]=b[k][i];\n        }\n    }\n}",
      "C++": "void bucketSort(vector<float>&a) {\n    int n=a.size();\n    vector<vector<float>>b(n);\n    for(float x:a) {\n        b[min(n-1,(int)(x*n))].push_back(x);\n    }\n    for(auto&v:b) {\n        sort(v.begin(),v.end());\n    }\n    a.clear();\n    for(auto&v:b) {\n        a.insert(a.end(),v.begin(),v.end());\n    }\n}",
      "Python": "def bucket_sort(a):\n    if len(a) < 2:\n        return a[:]\n\n    low, high = min(a), max(a)\n    if low == high:\n        return a[:]\n\n    bucket_count = len(a)\n    buckets = [[] for _ in range(bucket_count)]\n    for value in a:\n        index = int((value - low) / (high - low) * (bucket_count - 1))\n        buckets[index].append(value)\n\n    result = []\n    for bucket in buckets:\n        result.extend(sorted(bucket))\n    return result",
      "Java": "static double[] bucketSort(double[]a) {\n    int n=a.length;\n    List<Double>[]b=new ArrayList[n];\n    for(int i=0;i<n;i++) {\n        b[i]=new ArrayList<>();\n    }\n    for(double x:a) {\n        b[Math.min(n-1,(int)(x*n))].add(x);\n    }\n    for(List<Double>v:b) {\n        Collections.sort(v);\n    }\n    double[]o=new double[n];\n    int p=0;\n    for(List<Double>v:b) {\n        for(double x:v) {\n            o[p++]=x;\n        }\n    }\n    return o;\n}",
      "JavaScript": "function bucketSort(a) {\n    const k=a.length,b=Array.from( {\n        length:k\n    },()=>[]);\n    for(const x of a) {\n        b[Math.min(k-1,Math.floor(x*k))].push(x);\n    }\n    b.forEach(v=>v.sort((x,y)=>x-y));\n    return b.flat();\n}"
    }
  }
};
let selectedLanguage='Python';
function escCode(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function highlightCode(source){
 const token=/\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:0x[\da-f]+|\d+(?:\.\d+)?)\b|\b(?:def|return|for|while|if|else|elif|break|continue|in|is|not|and|or|True|False|None|import|from|as|pass|raise|new|class|static|void|int|float|double|bool|boolean|char|long|short|const|let|var|function|typeof|throw|try|catch|public|private|protected|final|this|auto|vector|size_t|include|using|namespace)\b|\b[A-Za-z_][A-Za-z0-9_]*(?=\s*\()/g;
 let output='', position=0, match;
 while((match=token.exec(source))){
  output+=escCode(source.slice(position,match.index));
  const value=match[0]; let kind='tok-function';
  if(value.startsWith('//')||value.startsWith('/*')||value.startsWith('#'))kind='tok-comment';
  else if(value[0]==='"'||value[0]==="'")kind='tok-string';
  else if(/^\d/.test(value))kind='tok-number';
  else if(/^(def|return|for|while|if|else|elif|break|continue|in|is|not|and|or|True|False|None|import|from|as|pass|raise|new|class|static|void|int|float|double|bool|boolean|char|long|short|const|let|var|function|typeof|throw|try|catch|public|private|protected|final|this|auto|vector|size_t|include|using|namespace)$/.test(value))kind='tok-keyword';
  output+='<span class="'+kind+'">'+escCode(value)+'</span>'; position=match.index+value.length;
 }
 return output+escCode(source.slice(position));
}
/* unified shell wiring (v48) */
const ORDER=['bubble','insertion','selection','merge','quick','heap','counting','radix','bucket'];
const IDX=n=>ORDER.indexOf(n);
let current=null,sim=null,timer=null,lastAnimatedKey='';
function renderLearning(){
 const d=LEARNING_DATA.info[current],langs=LEARNING_DATA.languages,el=$('sortLearn'+IDX(current));
 if(!el)return;
 el.innerHTML=`<div class="learning-head"><div><div class="eyebrow">ALGORITHM KNOWLEDGE</div><h2>${d.title} — Concept, Use &amp; Implementation</h2></div><label class="code-select">Language <select id="codeLang${IDX(current)}">${langs.map(l=>`<option ${l===selectedLanguage?'selected':''}>${l}</option>`).join('')}</select></label></div><div class="learning-grid"><article class="learning-card"><h3>How it works</h3><p>${d.idea}</p><h3>Where to use it</h3><p>${d.use}</p><h3>When to avoid it</h3><p>${d.avoid}</p><div class="learning-tags"><span>${d.properties}</span></div></article><article class="learning-card complexity-card"><h3>Complexity &amp; properties</h3><p>${d.complexity}</p><h3>Implementation</h3><div class="code-window"><pre><code id="code${IDX(current)}">${highlightCode(LEARNING_DATA.codes[current][selectedLanguage])}</code></pre></div><p class="code-note">Readable, syntax-coloured examples. Select a language to switch implementations.</p></article></div>`;
 const sel=$('codeLang'+IDX(current)),code=$('code'+IDX(current));
 if(sel&&code)sel.onchange=e=>{selectedLanguage=e.target.value;code.innerHTML=highlightCode(LEARNING_DATA.codes[current][selectedLanguage])};
}
function explain(){const s=sim.state,t=sim.type;if(s==='IDLE')return 'Press PLAY or STEP to begin. The simulation changes state explicitly rather than sorting invisibly.';if(s==='THINK')return 'Think Mode has paused before the decision. Use REVEAL to expose the next logical action.';if(s==='DONE')return 'The simulation is complete. The displayed array is the final result produced by the algorithm.';const map={bubble:'Adjacent values are compared; only an inverted pair is swapped.',insertion:'The current key is compared backward; larger values shift right until the insertion position is found.',selection:'The algorithm scans the remaining region and tracks the smallest value before placing it.',merge:'Two sorted runs are compared from their front; the smaller value moves into the merged result.',quick:'The last element of the active range is the pivot. Values ≤ pivot are moved toward the boundary.',heap:'The larger child is selected during heapify. The maximum is then extracted to the sorted suffix.',counting:'Counts are built first, then cumulative prefix positions, then values are placed from right to left.',radix:'The current digit determines the 0–9 bucket. Buckets are collected in order for the next digit pass.',bucket:'Values are distributed by range, each bucket is insertion-style sorted, then buckets are collected left to right.'};return map[t]}
function colorLegend(){
 const legends={
  bubble:[['compare','Compare','#ff9633'],['swap','Swap / movement','#ff4f5e'],['sorted','Sorted','#20c978'],['normal','Unprocessed','#2385f2']],
  insertion:[['key','KEY','#a855f7'],['compare','COMPARE','#ff4f5e'],['shift','SHIFT / movement','#ffd43b'],['sorted','SORTED PREFIX','#20c978']],
  selection:[['minimum','CURRENT MINIMUM','#a855f7'],['compare','COMPARE','#ff4f5e'],['swap','SWAP / movement','#ffd43b'],['sorted','SORTED','#20c978']],
  merge:[['left','LEFT RUN','#22d3ee'],['right','RIGHT RUN','#2385f2'],['compare','COMPARE','#ff4f5e'],['merged','MERGED','#a855f7']],
  quick:[['pivot','PIVOT','#ff9633'],['scan','SCAN','#22d3ee'],['boundary','BOUNDARY / swap','#ffd43b'],['sorted','FIXED','#20c978']],
  heap:[['node','HEAPIFY NODE','#a855f7'],['compare','CHILD COMPARISON','#ff4f5e'],['move','HEAPIFY / EXTRACT MOVE','#ffd43b'],['sorted','SORTED SUFFIX','#20c978']],
  counting:[['read','READ / COUNT','#2385f2'],['prefix','PREFIX','#a855f7'],['place','PLACE / movement','#ffd43b'],['sorted','OUTPUT','#20c978']],
  radix:[['digit','CURRENT DIGIT','#22d3ee'],['bucket','CURRENT BUCKET','#ffd43b'],['move','DIGIT MOVEMENT','#ff4f5e'],['output','COLLECTED OUTPUT','#20c978']],
  bucket:[['range','BUCKET RANGE','#2385f2'],['compare','COMPARE','#ff4f5e'],['swap','SWAP / movement','#ffd43b'],['output','COLLECTED','#20c978']]
 };
 const items=legends[current]||[];
 return `<div class="color-legend"><span class="legend-title">COLOUR CODE</span>${items.map(x=>`<span class="legend-item"><i style="background:${x[2]}"></i>${x[1]}</span>`).join('')}</div>`;
}
function specialView(){
 const displayArray=(current==='radix'||current==='bucket') ? sim.extra.liveArray : sim.array;
 const max=Math.max(...sim.array,1);
 const barCount=Math.max(displayArray.length,1);const bars=displayArray.map((v,i)=>{let cls='';
   if(sim.current&&sim.current.includes(i))cls='active';
   if(current==='bubble'&&sim.extra.left===i)cls+=' bubble-compare';
   if(current==='bubble'&&sim.state==='SWAP'&&(sim.extra.moveFrom===i||sim.extra.moveTo===i))cls+=' bubble-swap';
   if(current==='quick'&&sim.extra.pivotIndex===i)cls+=' pivot';
   if(current==='quick'&&sim.extra.scan===i)cls+=' scan';
   if(current==='quick'&&sim.extra.boundary===i)cls+=' boundary';
   if(current==='heap'&&i>=sim.extra.heapSize)cls+=' heap-sorted';
   if(current==='heap'&&sim.extra.node===i)cls+=' heap-node';
   if(current==='heap'&&sim.extra.compareNode&&sim.extra.compareNode.includes(i))cls+=' heap-compare';
   if(current==='heap'&&sim.extra.largest===i)cls+=' heap-largest';
   if(current==='heap'&&(sim.extra.moveFrom===i||sim.extra.moveTo===i))cls+=' heap-move';
   if(current==='insertion'){const e=sim.extra;if(i<e.pos)cls+=' insertion-sorted';if(i===e.pos)cls+=' insertion-key';if(i===e.compare)cls+=' insertion-compare';if(i===e.shiftFrom||i===e.shiftTo)cls+=' insertion-shift';}
   if(current==='selection'){const e=sim.extra;if(i<e.pos)cls+=' selection-sorted';if(i===e.min)cls+=' selection-min';if(i===e.compare)cls+=' selection-compare';}
   if(current==='counting'&&sim.state==='COUNTING'&&sim.extra.idx===i)cls+=' counting-read';
   if(current==='counting'&&sim.state==='PLACING'&&sim.extra.idx===i)cls+=' counting-place';
   if(current==='bucket'&&sim.state==='SORTING'&&sim.extra.sortBucket>=0&&sim.extra.sortIndex>=1){const b=sim.extra.buckets[sim.extra.sortBucket]||[];if(i===sim.extra.sortIndex-1||i===sim.extra.sortIndex)cls+=' bucket-compare';}
   if(sim.state==='DONE')cls+=' sorted';
   if(current==='radix'&&sim.extra.idx===i)cls+=' radix-current';
   if(current==='radix'&&sim.extra.moveFrom===i&&sim.extra.num!==null)cls+=' radix-moving';
   const BAR_MAX_HEIGHT=230;const BAR_MIN_HEIGHT=12;const barHeight=v==null?BAR_MIN_HEIGHT:Math.max(BAR_MIN_HEIGHT,(v/max)*BAR_MAX_HEIGHT);return `<div class="bar-wrap" data-index="${i}"><div class="bar ${cls}${v==null?' live-empty':''}" style="height:${barHeight}px"></div><div class="bar-label">${v==null?'':v}</div><div class="index">${i}</div></div>`}).join('');
 let out=`<div class="live-caption"><span class="live-dot"></span> LIVE ARRAY / CURRENT OPERATION</div><div class="bars" style="--bar-count:${barCount}">${bars}</div>${colorLegend()}`;
 if(current==='insertion')out+=`<div class="legend-inline"><span class="legend-key key">KEY</span><span class="legend-key compare">COMPARE</span><span class="legend-key shift">SHIFT</span><span class="legend-key sorted">SORTED PREFIX</span></div>`;
 if(current==='selection'){const e=sim.extra;out+=`<div class="selection-live"><b>Pass ${Math.min(e.pos+1,sim.array.length)}</b><span>Minimum candidate: <strong>${sim.array[e.min]!==undefined?sim.array[e.min]:'—'}</strong></span><span>Comparing index: <strong>${e.compare < sim.array.length ? e.compare : 'done'}</strong></span></div>`}
 if(current==='merge'){const e=sim.extra;const cl=e.li<e.left.length?e.left[e.li]:null,cr=e.ri<e.right.length?e.right[e.ri]:null;const n=sim.array.length;const splitLevels=[];let ranges=[{s:0,e:n}];while(ranges.length){splitLevels.push(ranges);const next=[];ranges.forEach(r=>{if(r.e-r.s>1){const m=Math.floor((r.s+r.e)/2);next.push({s:r.s,e:m},{s:m,e:r.e})}});ranges=next;}const visibleLevels=splitLevels.filter(lv=>lv.some(r=>r.e-r.s>1));const tree=visibleLevels.map((lv,li)=>`<div class="merge-tree-level" style="--tree-cols:${n}">${lv.map(r=>{const active=r.s===e.start&&r.e===e.end;const span=Math.max(1,r.e-r.s);const label=li===0?'FULL ARRAY':(r.e-r.s===1?'BASE CASE':`SPLIT`);return `<div class="merge-tree-node ${active?'active':''}" style="grid-column:${r.s+1} / span ${span}"><small>${label}</small><b>${r.s}–${r.e-1}</b></div>`}).join('')}</div>`).join('');const phaseRange=e.start>=0?`${e.start}–${e.end-1}`:'—';const mid=e.start>=0?Math.floor((e.start+e.end)/2):null;const phaseText=e.treePhase==='DIVIDE'?`Splitting range ${phaseRange}`:(cl!==null&&cr!==null?`Comparing ${cl} and ${cr}`:`Merging range ${phaseRange}`);out=`<div class="algorithm-stage merge-stage"><div class="stage-array"><div class="live-caption"><span class="live-dot"></span> LIVE ARRAY / CURRENT MERGE</div><div class="bars" style="--bar-count:${barCount}">${bars}</div>${colorLegend()}</div><aside class="stage-side merge-side"><div class="panel-title">LIVE DIVIDE — CONQUER <span>${e.treePhase} — merge ${e.mergeNumber||'—'}</span></div><div class="merge-phase-card"><b>${phaseText}</b><span>${e.treePhase==='DIVIDE'?'Keep splitting until each run has one element.':(mid!==null?`Left [${e.start}–${mid-1}] + Right [${mid}–${e.end-1}] — sorted run.`:'Build the sorted run from the two halves.')}</span></div><div class="merge-tree-head"><b>DIVIDE MAP</b><span>current range highlighted</span></div><div class="merge-tree">${tree}</div><div class="move-caption">${e.moveFrom>=0?`Moving ${e.movingValue} from ${e.moveSource} — merged position ${e.moveTo}`:(e.treePhase==='DIVIDE'?'Choose SPLIT to divide the current range.':'Merge the two runs from the front.')} </div></aside></div>`}
 if(current==='quick'){const e=sim.extra;const left=e.low>=0&&e.pivotIndex>e.low?sim.array.slice(e.low,e.pivotIndex).filter(v=>v<=e.pivotValue):[];const right=e.low>=0&&e.pivotIndex>e.low?sim.array.slice(e.low,e.pivotIndex).filter(v=>v>e.pivotValue):[];out=`<div class="algorithm-stage quick-stage"><div class="stage-array"><div class="live-caption"><span class="live-dot"></span> LIVE ARRAY / PARTITION</div><div class="bars" style="--bar-count:${barCount}">${bars}</div>${colorLegend()}</div><aside class="stage-side quick-side-panel"><div class="panel-title">LIVE PARTITION CALCULATION <span>pivot index ${e.pivotIndex>=0?e.pivotIndex:'—'}</span></div><div class="quick-live"><div class="quick-calc"><div class="pivot-card"><small>LIVE PIVOT</small><strong>${e.pivotValue!=null?e.pivotValue:'—'}</strong><span>index ${e.pivotIndex>=0?e.pivotIndex:'—'}</span></div><div class="quick-side"><div><b>LEFT / — PIVOT</b><div class="chips">${left.map(v=>`<span class="chip quick-left">${v}</span>`).join('')||'<span class="empty">waiting—</span>'}</div></div><div><b>RIGHT / &gt; PIVOT</b><div class="chips">${right.map(v=>`<span class="chip quick-right">${v}</span>`).join('')||'<span class="empty">waiting—</span>'}</div></div></div></div><div class="quick-metrics"><span><b>Active range</b> [${e.low>=0?e.low:'—'}, ${e.high>=0?e.high:'—'}]</span><span><b>Scan</b> ${e.scan>=0?e.scan:'—'}</span><span><b>Boundary</b> ${e.boundary>=0?e.boundary:'—'}</span><span><b>Decision</b> ${e.scan>=0&&e.pivotValue!=null?(sim.array[e.scan]<=e.pivotValue?'— pivot — LEFT':'&gt; pivot — RIGHT'):'—'}</span></div></div></aside></div>`}
 if(current==='heap'){const e=sim.extra;const levels=[];let startIdx=0,level=0;while(startIdx<sim.array.length){const count=Math.min(2**level,sim.array.length-startIdx);levels.push(sim.array.slice(startIdx,startIdx+count).map((v,j)=>{const i=startIdx+j;const role=e.compareNode&&e.compareNode.includes(i)?(e.largest===i?'largest':'compare'):(e.node===i?'node':'');return `<div class="heap-node-card ${role} ${i>=e.heapSize?'fixed':''}"><span>${i}</span><b>${v}</b></div>`}).join(''));startIdx+=count;level++;}out=`<div class="algorithm-stage heap-stage"><div class="stage-array"><div class="live-caption"><span class="live-dot"></span> LIVE ARRAY / HEAP OPERATIONS</div><div class="bars" style="--bar-count:${barCount}">${bars}</div>${colorLegend()}</div><aside class="stage-side heap-side"><div class="panel-title">${e.mode} HEAP — LIVE TREE <span>size ${e.heapSize} — node ${e.node!=null?e.node:'—'}</span></div><div class="heap-mode"><label>Heap mode <select id="heapMode"><option value="MAX" ${e.mode==='MAX'?'selected':''}>MAX HEAP</option><option value="MIN" ${e.mode==='MIN'?'selected':''}>MIN HEAP</option></select></label><span>${e.mode==='MAX'?'largest child rises':'smallest child rises'}</span></div><div class="heap-tree-real">${levels.map((x,i)=>`<div class="heap-level level-${i}">${x}</div>`).join('')}</div><div class="heap-arrow-live"><span>${e.movingValue!=null?e.movingValue:'—'}</span><strong>==&gt;</strong><span>${e.moveTo>=0?`index ${e.moveTo}`:'waiting'}</span></div><div class="heap-note">Purple = heapify node — red = child comparison — green = selected child — yellow = live movement — faded = sorted suffix.</div></aside></div>`}
 if(current==='counting')out+=`<div class="special"><div class="special-card"><h3>Frequency Count</h3><div class="table">${sim.extra.counts.map((v,i)=>`<div class="cell"><em>${sim.extra.min+i}</em><b>${v}</b></div>`).join('')}</div></div><div class="special-card"><h3>Prefix Sum</h3><div class="table">${sim.extra.prefix.map((v,i)=>`<div class="cell"><em>${sim.extra.min+i}</em><b>${v}</b></div>`).join('')}</div></div></div>`;
 if(current==='radix'){const e=sim.extra;const label=e.place===1?'ONES':e.place===10?'TENS':e.place===100?'HUNDREDS':`${e.place}s`;const activeDigit=e.num!=null?Math.floor(e.num/e.place)%10:null;out=`<div class="algorithm-stage radix-stage"><div class="stage-array"><div class="live-caption"><span class="live-dot"></span> LIVE ARRAY / ${label} DIGIT</div><div class="bars compact-bars" style="--bar-count:${barCount}">${bars}</div>${colorLegend()}</div><aside class="stage-side radix-panel"><div class="panel-title">RADIX PASS ${e.passes||1} — ${label} DIGIT <span>${activeDigit!==null?`LIVE DIGIT = ${activeDigit}`:'TRAVERSING / REBUILDING'}</span></div><div class="radix-live-note"><b>BUCKETS</b><span>0 — 9 stable distribution</span></div><div class="bucket-grid radix-grid compact-grid">${e.buckets.map((b,i)=>`<div class="bucket radix-bucket ${e.bucket===i?'current-bucket':''} ${activeDigit===i?'digit-target':''}"><b>Bucket ${i}</b><small>${label}${activeDigit===i?' — TARGET':''}</small><div class="chips">${b.map(x=>`<span class="chip digit-chip d${i%6}">${x}</span>`).join('')||'<span class="empty">—</span>'}</div></div>`).join('')}</div><div class="move-caption">${e.moveKind==='COLLECT'?`Throw ${e.movingValue} — LIVE ARRAY position ${e.moveTo}`:e.moveKind==='BUCKET'?`Remove ${e.movingValue} — Bucket ${e.moveTo}`:'Live digit pass continues.'}</div></aside></div>`}
 if(current==='bucket'){const e=sim.extra;const min=Math.min(...sim.defaultArray),maxB=Math.max(...sim.defaultArray);out=`<div class="algorithm-stage bucket-stage"><div class="stage-array"><div class="live-caption"><span class="live-dot"></span> LIVE ARRAY / BUCKET DISTRIBUTION</div><div class="bars compact-bars" style="--bar-count:${barCount}">${bars}</div>${colorLegend()}</div><aside class="stage-side bucket-panel"><div class="panel-title">LIVE BUCKET DISTRIBUTION + SORTING <span>Limits: ${min} to ${maxB}</span></div><div class="bucket-live-note"><b>BUCKETS</b><span>Range-based distribution — insertion-style sorting</span></div><div class="bucket-grid compact-grid">${e.buckets.map((b,i)=>{const lo=Math.floor(min+i*(maxB-min+1)/e.bucketCount),hi=Math.floor(min+(i+1)*(maxB-min+1)/e.bucketCount)-1;return `<div class="bucket range-bucket ${e.sortBucket===i?'active-sort-bucket':''}"><b>Bucket ${i+1}</b><small>${lo} — ${hi}</small><div class="chips">${b.map((x,j)=>`<span class="chip digit-chip d${(i+j)%6} ${e.sortBucket===i&&(j===e.sortIndex||j===e.sortIndex-1)?'live-compare-chip':''}">${x}</span>`).join('')||'<span class="empty">—</span>'}</div></div>`}).join('')}</div><div class="move-caption">${e.moveKind==='DISTRIBUTE'?`Remove ${e.movingValue} — Bucket ${e.moveTo+1}`:e.moveKind==='COLLECT'?`Throw ${e.movingValue} — LIVE ARRAY position ${e.moveTo}`:e.moveKind==='SWAP'?`Swap inside Bucket ${e.sortBucket+1}: ${e.moveFrom-1} — ${e.moveFrom}`:'Live bucket operation appears beside the bars.'}</div></aside></div>`}
 return out}
function progressPct(){
 const e=sim.extra||{},n=sim.array.length,t=sim.type;
 if(sim.state==='DONE')return 100;
 if(t==='bubble'&&n>1)return Math.min(100,Math.round(e.pass/(n-1)*100));
 if(t==='insertion'&&n>1)return Math.min(100,Math.round(e.pos/n*100));
 if(t==='selection'&&n>1)return Math.min(100,Math.round(e.pos/n*100));
 if(t==='merge'&&e.jobs&&e.jobs.length)return Math.min(100,Math.round(e.job/e.jobs.length*100));
 if(t==='quick'&&n){const a=sim.array;let pref=0;while(pref<n&&a[pref]<=a[pref+1])pref++;let suf=0;while(suf<n-pref&&a[n-1-suf]>=a[n-2-suf])suf++;const pct=Math.min(100,Math.round((pref+1+suf)/n*100));if(sim.state==='DONE')return 100;if(!e._qmax)e._qmax=0;e._qmax=Math.max(e._qmax,pct);return e._qmax}
 if(t==='heap'&&n)return Math.min(100,Math.round((n-e.heapSize)/n*100));
 if(t==='counting'&&e.counts&&e.counts.length){
  if(sim.state==='COUNTING')return Math.min(45,Math.round(e.idx/n*45));
  if(sim.state==='PREFIX')return Math.min(70,45+Math.round(e.idx/e.counts.length*25));
  if(sim.state==='PLACING')return Math.min(98,70+Math.round((n-1-e.idx)/n*28));
  return 0;
 }
 if(t==='radix'){
  const passes=e.maxPlace?Math.round(Math.log10(e.maxPlace))+1:1;
  if(sim.state==='DONE')return 100;
  const base=Math.round((e.passes-1)/passes*100);
  if(sim.state==='READING')return Math.min(base+45,base+Math.round(e.idx/Math.max(n,1)*45));
  if(sim.state==='BUCKETING')return Math.min(base+55,base+Math.round(e.idx/Math.max(n,1)*45+10));
  if(sim.state==='COLLECTING')return Math.min(base+95,base+55);
  return base;
 }
 if(t==='bucket'){
  if(sim.state==='DISTRIBUTE')return Math.round(e.idx/Math.max(n,1)*35);
  if(sim.state==='SORTING')return 35+Math.round(e.sortBucket/Math.max(e.buckets.length,1)*40);
  if(sim.state==='REVEAL')return 35+Math.round(e.sortBucket/Math.max(e.buckets.length,1)*40);
  if(sim.state==='COLLECT'){const flat=e.buckets.flat();return 75+Math.round(e.idx/Math.max(flat.length,1)*25)}
  return 0;
 }
 return 0;
}
function activeSpeed(){const el=$('spd'+IDX(current));return el?+el.value:420}
function syncTimer(){if(sim&&sim.running){if(!timer)timer=setInterval(loop,activeSpeed());else{clearInterval(timer);timer=setInterval(loop,activeSpeed())}}else if(timer){clearInterval(timer);timer=null}}
function stop(){if(timer){clearInterval(timer);timer=null}if(sim)sim.running=false}
function loop(){if(!sim||!sim.running||sim.state==='DONE'){if(sim&&sim.state==='DONE'){sim.running=false;syncTimer()}return}sim.step(true);render()}
function render(){
 if(!sim||!current)return;
 const n=IDX(current),c=configs[current];
 const st=$('s'+n);if(st){st.textContent=sim.state+' — '+sim.msg;st.className='status'+(sim.state==='DONE'?' ok':(sim.state==='THINK'||sim.state==='COMPARE'||sim.state==='SWAP'||sim.state==='MOVING'?' hl':''))}
 const pf=$('prog'+n);if(pf)pf.style.width=progressPct()+'%';
 const pb=$('play'+n);if(pb)pb.textContent=sim.running?'⏸ Pause':'▶ Play';
  const tb=$('think'+n);if(tb)tb.textContent=sim.think?'🧠 Think: ON':'🤔 Think: OFF';
  const ex=$('exp'+n);if(ex)ex.textContent=explain();
 const cx=$('cx'+n);if(cx)cx.innerHTML=`<div class="complexity-metric"><strong>Best time</strong><b>${c.complexity[0]}</b></div><div class="complexity-metric"><strong>Average time</strong><b>${current==='bubble'||current==='insertion'||current==='selection'?'O(n·n)':current==='quick'?'O(n log n)':current==='bucket'?'O(n+k) expected':current==='counting'?'O(n+k)':current==='radix'?'O(d·(n+b))':'O(n log n)'}</b></div><div class="complexity-metric"><strong>Worst time</strong><b>${c.complexity[1]}</b></div><div class="complexity-metric"><strong>Auxiliary space</strong><b>${c.complexity[2]}</b></div><div class="complexity-special"><strong>Special case / note</strong><span>${c.special||'Complexity assumes the standard implementation and stated input conditions.'}</span></div>`;
 renderLearning();
 const w=$('ws'+n);if(w)w.innerHTML=`<div class="stats"><div class="stat"><span>Comparisons / reads</span><b>${sim.comparisons}</b></div><div class="stat"><span>Swaps / moves</span><b>${sim.type==='bubble'||sim.type==='selection'||sim.type==='quick'||sim.type==='heap'?sim.swaps:sim.moves}</b></div><div class="stat"><span>State</span><b>${sim.state}</b></div><div class="stat"><span>Elements</span><b>${sim.array.length}</b></div></div>${specialView()}`;
 requestAnimationFrame(animateLiveMovement);
}
function syncCustomInput(){const el=$('cust'+IDX(current));if(el)el.value=sim.defaultArray.join(', ')}
function applyCustom(n){
 const el=$('cust'+n);if(!el)return;const raw=el.value.trim();if(!raw){el.focus();return}
 const values=raw.split(/[\s,;]+/).filter(Boolean).map(Number);
 try{stop();sim.setCustomArray(values);syncCustomInput();render()}catch(err){el.setCustomValidity(err.message);el.reportValidity();el.setCustomValidity('')}
}
function togglePlay(){if(!sim)return;if(sim.state==='DONE')return;if(sim.running){sim.pause()}else{sim.play()}syncTimer();render()}
function doStep(){if(!sim)return;if(sim.state==='DONE')return;sim.running=true;sim.step(false);sim.running=false;syncTimer();render()}
function doThink(){if(!sim)return;sim.toggleThink();render()}
function doReveal(){if(!sim)return;sim.reveal();render()}
function doReset(){if(!sim)return;stop();sim.reset();render();syncCustomInput()}
function doNewArray(){if(!sim)return;stop();sim.newArray();syncCustomInput();render()}
function goHome(){stop();current=null;sim=null;$('homeScreen').style.display='';$('algoScreen').style.display='none';$('backBtn').classList.remove('show');document.querySelectorAll('.panel.on').forEach(p=>p.classList.remove('on'));document.querySelectorAll('.sort-nav-btn.active').forEach(b=>b.classList.remove('active'))}
function showAlgo(n){
 if(n<0||n>=ORDER.length)return;
 stop();current=ORDER[n];sim=new Sim(current);
 $('homeScreen').style.display='none';$('algoScreen').style.display='';$('backBtn').classList.add('show');
 document.querySelectorAll('.panel.on').forEach(p=>p.classList.remove('on'));
 const panel=$('p'+n);if(panel)panel.classList.add('on');
 document.querySelectorAll('.sort-nav-btn').forEach(b=>b.classList.toggle('active',+b.dataset.a===n));
 syncCustomInput();render();
}
function animateLiveMovement(){
 const e=sim&&sim.extra?sim.extra:{};
 const isSwap=e.moveKind==='SWAP'||sim.state==='SWAP';
 const isHeapSwap=current==='heap'&&e.moveFrom>=0&&e.moveTo>=0&&e.movingValue!=null&&(sim.state==='HEAPIFY'||sim.state==='SWAP');
 if(!isSwap&&!isHeapSwap)return;
 const from=Number(e.moveFrom),to=Number(e.moveTo);
 if(!Number.isInteger(from)||!Number.isInteger(to)||from===to)return;
 const container=document.querySelector('#ws'+IDX(current)+' .bars');
 if(!container)return;
 const a=container.querySelector('.bar-wrap[data-index="'+from+'"]');
 const b=container.querySelector('.bar-wrap[data-index="'+to+'"]');
 if(!a||!b)return;
 const key=current+':'+sim.swaps+':'+from+':'+to+':'+e.movingValue+':'+sim.state;
 if(key===lastAnimatedKey)return;
 lastAnimatedKey=key;
 const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(),cr=container.getBoundingClientRect();
 const ax=ar.left+ar.width/2-cr.left,ay=ar.top+ar.height/2-cr.top;
 const bx=br.left+br.width/2-cr.left,by=br.top+br.height/2-cr.top;
 const dx=bx-ax,dy=by-ay;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.classList.add('swap-overlay');
 svg.setAttribute('viewBox','0 0 '+cr.width+' '+cr.height);
 svg.setAttribute('width',cr.width);svg.setAttribute('height',cr.height);
 const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');
 const marker=document.createElementNS('http://www.w3.org/2000/svg','marker');
 const markerId='swapHead_'+Date.now()+'_'+Math.random().toString(36).slice(2);
 marker.setAttribute('id',markerId);marker.setAttribute('markerWidth','10');marker.setAttribute('markerHeight','10');
 marker.setAttribute('refX','8');marker.setAttribute('refY','4');marker.setAttribute('orient','auto');marker.setAttribute('markerUnits','strokeWidth');
 const head=document.createElementNS('http://www.w3.org/2000/svg','path');
 head.setAttribute('d','M0,0 L9,4 L0,8 Z');head.setAttribute('fill','#ffd43b');marker.appendChild(head);defs.appendChild(marker);svg.appendChild(defs);
 const lift=Math.max(48,Math.abs(bx-ax)*0.32);
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('d','M '+ax+' '+ay+' Q '+((ax+bx)/2)+' '+(Math.min(ay,by)-lift)+' '+bx+' '+by);
 path.setAttribute('fill','none');path.setAttribute('stroke','#ffd43b');path.setAttribute('stroke-width','4');path.setAttribute('stroke-linecap','round');
 path.setAttribute('marker-end','url(#'+markerId+')');svg.appendChild(path);container.appendChild(svg);
 const len=path.getTotalLength();path.style.strokeDasharray=len;path.style.strokeDashoffset=len;
 const makeClone=(source,startDx,startDy)=>{
   const c=source.cloneNode(true);
   c.classList.add('swap-clone');
   c.style.position='absolute';c.style.left=source.offsetLeft+'px';c.style.top=source.offsetTop+'px';
   c.style.width=source.offsetWidth+'px';c.style.height=source.offsetHeight+'px';
   c.style.margin='0';c.style.zIndex='50';c.style.pointerEvents='none';c.style.opacity='1';
   container.appendChild(c);
   c.animate([{transform:'translate('+startDx+'px,'+startDy+'px)',filter:'drop-shadow(0 0 16px #ffd43b)'},{transform:'translate(0,0)',filter:'drop-shadow(0 0 6px #ffd43b)'}],{duration:680,easing:'cubic-bezier(.25,.1,.25,1)',fill:'forwards'});
   return c;
 };
 const ca=makeClone(a,dx,dy);
 const cb=makeClone(b,-dx,-dy);
 a.style.opacity='0.12';b.style.opacity='0.12';
 path.animate([{strokeDashoffset:len},{strokeDashoffset:0}],{duration:550,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
 setTimeout(()=>{
   svg.remove();ca.remove();cb.remove();a.style.opacity='';b.style.opacity='';
 },720);
}
function bindPanel(n){
 $('play'+n).onclick=togglePlay;
 $('step'+n).onclick=doStep;
 $('think'+n).onclick=doThink;
 $('reveal'+n).onclick=doReveal;
 $('reset'+n).onclick=doReset;
 $('newarray'+n).onclick=doNewArray;
 $('custbtn'+n).onclick=()=>applyCustom(n);
 $('cust'+n).addEventListener('keydown',ev=>{if(ev.key==='Enter')applyCustom(n)});
 $('spd'+n).oninput=ev=>{$('spdv'+n).textContent=ev.target.value+'ms';syncTimer()};
}
document.addEventListener('change',e=>{if(e.target.id==='heapMode'&&current==='heap'){stop();sim.extra.mode=e.target.value;sim.reset();sim.extra.mode=e.target.value;render()}});
document.querySelectorAll('.card[data-a]').forEach(card=>{card.addEventListener('click',()=>showAlgo(+card.dataset.a))});
document.querySelectorAll('.sort-nav-btn[data-a]').forEach(btn=>{btn.addEventListener('click',()=>showAlgo(+btn.dataset.a))});
$('backBtn').onclick=goHome;
ORDER.forEach((_,n)=>bindPanel(n));
for(let n=0;n<ORDER.length;n++)$('spdv'+n).textContent=$('spd'+n).value+'ms';
