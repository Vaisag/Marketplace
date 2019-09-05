const Marketplace = artifacts.require("./Marketplace.sol");
require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('Marketplace', ([deployer, seller, buyer]) => {

let marketplace;
	before(async () =>{
		marketplace = await Marketplace.deployed()
	})

	describe('deployment', async () =>{
		it('deploys successfully', async () =>{
			const address = await marketplace.address
			assert.notEqual(address, 0x0)
			assert.notEqual(address, ' ')
			assert.notEqual(address, null)
			assert.notEqual(address, undefined)
		})
		it('has a name', async () => {
			const name = await marketplace.name()
			assert.equal(name,'Dapp University Marketplace')
		})
	})

	describe('products', async () =>{
		let result, productCount

		before(async () =>{
			result = await marketplace.createProduct('iPhone X', web3.utils.toWei('1', 'Ether'), {from: seller})
			productCount = await marketplace.productCount()
		})
		it('creates products', async () =>{
			// Success
			assert.equal(productCount, 1)	
			const event = result.logs[0].args
			assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
			assert.equal(event.name, 'iPhone X', 'name is correct')
			assert.equal(event.price, '1000000000000000000', 'price is correct')
			assert.equal(event.owner, seller, 'seller is correct')
			assert.equal(event.purchased, false, 'purchased is correct')

			// Failure : product must have a name
			await await marketplace.createProduct('', web3.utils.toWei('1', 'Ether'), {from: seller}).should.be.rejected

			// Failure : product must have a price
			await await marketplace.createProduct('iPhone X', 0, {from: seller}).should.be.rejected

		})

		it('lists products', async() => {

			const product = await marketplace.products(productCount)
			assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct')
			assert.equal(product.name, 'iPhone X', 'name is correct')
			assert.equal(product.price, '1000000000000000000', 'price is correct')
			assert.equal(product.owner, seller, 'seller is correct')
			assert.equal(product.purchased, false, 'purchased is correct')
		})
			it('sells products', async() => {
			// Track seller balance before purchase
			let oldSellerBalance 
			oldSellerBalance = await web3.eth.getBalance(seller)
			// convert the balance into Big Number
			oldSellerBalance = new web3.utils.BN(oldSellerBalance)

			// Success: Buyer makes a purchase
			const result = await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('1','Ether')})

			// Check logs
			const event = result.logs[0].args
			assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct')
			assert.equal(event.name, 'iPhone X', 'name is correct')
			assert.equal(event.price, '1000000000000000000', 'price is correct')
			assert.equal(event.owner, buyer, 'buyer is correct')
			assert.equal(event.purchased, true, 'purchased is correct')

			// Check that seller received funds
			let newSellerBalance
			newSellerBalance = await web3.eth.getBalance(seller)
			newSellerBalance = new web3.utils.BN(newSellerBalance)

			let price
			price = await web3.utils.toWei('1', 'Ether')
			price = new web3.utils.BN(price)

			const expectedBalance = oldSellerBalance.add(price)
			assert.equal(expectedBalance.toString(), newSellerBalance.toString(), 'seller received funds')

			// Failure : Tries to buy a product that does not exist, product must have valid id
			await marketplace.purchaseProduct(99, {from: buyer, value: web3.utils.toWei('1','Ether')}).should.be.rejected
			// Failure : Buyer tries to buy without enough ether
			await marketplace.purchaseProduct(productCount, {from: buyer, value: web3.utils.toWei('0.1','Ether')}).should.be.rejected
			// Failure : Seller tries to buy their own product
			await marketplace.purchaseProduct(productCount, {from: seller, value: web3.utils.toWei('1','Ether')}).should.be.rejected
			// Failure : Deployer tries to purchase a product which is already been purchased
			await marketplace.purchaseProduct(productCount, {from: deployer, value: web3.utils.toWei('1','Ether')}).should.be.rejected

		})
	})
})