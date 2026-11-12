// Fallback question bank: [question, options, correctIndex, explanation]
const R = [
 ['Which data structure follows FIFO?',['Stack','Queue','Tree','Graph'],1,'A queue is First In, First Out.'],
 ['Which data structure follows LIFO?',['Queue','Heap','Stack','Array'],2,'A stack is Last In, First Out.'],
 ['Average time complexity of binary search?',['O(n)','O(log n)','O(n^2)','O(1)'],1,'Each step halves the search space.'],
 ['Which SQL command removes a table entirely?',['DELETE','TRUNCATE','DROP','REMOVE'],2,'DROP deletes the table definition and data.'],
 ['Which key uniquely identifies a row?',['Foreign key','Primary key','Candidate index','Alias'],1,'A primary key uniquely identifies each row.'],
 ['Which OSI layer handles routing?',['Data Link','Transport','Network','Session'],2,'The Network layer handles IP routing.'],
 ['Which scheduling algorithm can cause starvation?',['Round Robin','FCFS','Priority Scheduling','None'],2,'Low priority processes may wait forever.'],
 ['Which keyword creates a subclass in Java?',['implements','extends','inherits','super'],1,'`extends` creates an inheriting class.'],
 ['Which Python type is immutable?',['list','dict','set','tuple'],3,'Tuples cannot be modified after creation.'],
 ['What does HTTP status 404 mean?',['Server error','Unauthorized','Not found','Redirect'],2,'404 means the resource was not found.'],
 ['Which algorithm is used for supervised classification?',['K-means','Decision tree','Apriori','PCA'],1,'Decision trees learn from labelled data.'],
 ['Which is a principle of software engineering?',['Spaghetti coding','Modularity','Hardcoding','Copy-paste'],1,'Modularity splits software into manageable parts.'],
];
export const bank = R.map(([question, options, correctAnswer, explanation]) => ({ question, options, correctAnswer, explanation }));
