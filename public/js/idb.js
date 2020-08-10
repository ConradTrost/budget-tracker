// create variable to hold db connection
let db;
// establish connection to indexedDB db called 'budget_tracker' version 1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    // save a reference to the db
    const db = event.target.result;
    // create obkect store called 'new_transaction'
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;

    // check if online
    if (navigator.online) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    // log err
    console.log(event.target.errorCode);
}

// if offline
function saveRecord(record) {
    // open transaction w/ db w/ read/write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add record to store
    transactionObjectStore.add(record);
};

// upload to mongoDB
function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open another transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                // clear store
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted...');
            })
            .catch(err => {
                console.log(err);
            });
        }
    };
};

window.addEventListener('online', uploadTransaction());