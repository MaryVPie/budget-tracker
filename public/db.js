let db;
let dbVersion = 3;
const dbName = 'BudgetDb';
const storeName = 'budget';

const request = indexedDB.open(dbName, dbVersion );

request.onerror = function ( e ) {
	console.log( `An error: ${e.target.errorCode}` );
};

request.onupgradeneeded = function ( e ) {
	console.log( 'Upgrading indexedDB' );

	const { oldVersion } = e;
	const newVersion = e.newVersion || db.version;

	console.log( `indexedDB updated from V${oldVersion} to V${newVersion}` );

	db = e.target.result;

	if( db.objectStoreNames.length === 0 ) {
		db.createObjectStore( storeName, { autoIncrement: true } );
	}
};

// On Success
request.onsuccess = function ( e ) {
	console.log( 'Successfully opened indexedDB' );

	db = e.target.result;

	if( navigator.onLine ) {
		console.log( 'Backend online' );

		checkDatabase();
	}
};

// Utility function for making transactions and returning as a store
function makeStore( sName ) {
	const transaction = db.transaction( [ sName ], 'readwrite' );

	const store = transaction.objectStore( sName );

	return store;
}

// Check the Indexed Database
function checkDatabase() {
	console.log( 'Checking DB' );

	const store = makeStore( storeName );

	const getAll = store.getAll();

	getAll.onsuccess = function () {
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

						console.log( 'indexedDB Cleared' );
					}
				} );
		}
	};
}

// Save an offline data
const saveRecord = ( record ) => {
	console.log( 'Saving offline record' );

	const store = makeStore( storeName );

	store.add( record );
};

window.addEventListener( 'online', checkDatabase );