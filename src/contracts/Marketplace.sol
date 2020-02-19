pragma solidity >=0.4.21 <0.6.0;

/**
 * The Marketplace contract helps regulate the marketplace...
 */
contract Marketplace {
	string public name;
	uint public productCount = 0;
	mapping(uint => Product) public products;
	address public deployer;

	struct Product{
		uint id;
		string name;
		uint price;
		address payable owner;
		bool purchased;
	}
    event ProductCreated(
    	uint id,
		string name,
		uint price,
		address payable owner,
		bool purchased
    	);

        event ProductPurchased(
    	uint id,
		string name,
		uint price,
		address payable owner,
		bool purchased
    	);
    
	constructor () public {
		name = "Dapp University Marketplace";
		deployer = msg.sender;
	}	

	function createProduct (string memory _name, uint _price) public restricted{
		// Require a valid name
		require (bytes(_name).length > 0);
		
		// Require a valid price
		require (_price > 0 );
		
		// Increment product count
		productCount ++;

		// Create the product
        products[productCount] = Product(productCount, _name, _price, msg.sender, false);

        // Trigger an event - this will help the result to be logged and thereby we can access it from test file
        emit ProductCreated(productCount, _name, _price, msg.sender, false);
	}


	function purchaseProduct (uint _id) public payable{
		// Fetch the product
		// memory is used to create a copy of it(used when we are not refering to the one existing in the blockchain)
		Product memory _product = products[_id];

		// Fetch the owner
		address payable _seller = _product.owner;

		// Make sure the product has a valid id
		require (_product.id > 0 && _product.id <= productCount);
		
		// Require that there is enough Ether sent in the transaction
		require(msg.value >= _product.price, 'not enough Ether');

		// Require that the product is not already purchased
		require(!_product.purchased);

		// Require that the buyer is not the seller
		require(_seller != msg.sender);

		// Purchase it
		// Transfer ownership to the buyer
		_product.owner = msg.sender;
		// Mark as purchased
		_product.purchased = true;
		// Update the product in the mapping
		products[_id] = _product;
		// Pay the seller by sending them Ether
		address(_seller).transfer(msg.value);
		// Trigger an event
		emit ProductPurchased(productCount, _product.name, _product.price, msg.sender, true);
	}

	    modifier restricted(){
        			require( msg.sender == deployer, "Only owner can call this function." );
        			_;	
        		}
}

