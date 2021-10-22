let db;
let dbBudget;
const storeName = 'BudgetStore';

const request = indexedDB.open( 'BudgetDB', dbBudget );

request.onError = function ( event ) {
	console.log( `An error: ${event.target.errorCode}` );
};

request.onUpgradeNeeded = function ( event ) {
	console.log( 'Upgrading indexedDB' );

	const { oldBudget } = event;
	const newBudget = event.newBudget || db.budget;

	console.log( `indexedDB updated from V${oldBudget} to V${newBudget}` );

	db = event.target.result;

	if( db.objectStoreNames.length === 0 ) {
		db.createObjectStore( storeName, { autoIncrement: true } );
	}
};


request.onSuccess = function ( event ) {
	console.log( 'Successfully opened indexedDB' );

	db = event.target.result;

	if( navigator.onLine ) {


		checkDatabase();
	}
};

function makeStore( storeName ) {
	const transaction = db.transaction( [ storeName ], 'readwrite' );
	const store = transaction.objectStore( storeName );

	return store;
}


function checkDatabase() {
	console.log( 'Checking DB' );

	const store = makeStore( storeName );

	const getAll = store.getAll();

	getAll.onSuccess = function () {
		if( getAll.result.length > 0 ) {
			fetch( '/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify( getAll.result ),
				headers: {
					Accept: 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				}
			} )
				.then( ( response ) => response.json() )
				.then( ( res ) => {
					if( res.length !== 0 ) {
						const store = makeStore( storeName );

						store.clear();
					}
				} );
		}
	};
}


const saveRecord = ( record ) => {
	console.log( 'Saving offline record' );

	const store = makeStore( storeName );

	store.add( record );
};

window.addEventListener( 'online', checkDatabase );