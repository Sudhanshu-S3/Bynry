from app import db

@app.route('/api/products', methods=['POST']) 
def create_product(): 
    data = request.json 
     
    # Create new product 
    product = Product( 
        name=data['name'], 
        sku=data['sku'], 
        price=data['price'], 
        warehouse_id=data['warehouse_id'] 
    ) 
     
    db.session.add(product) 

    # Removed the commit and put a flush to maintain the ATOMICITY
    db.session.flush() 
     
    # Update inventory count 
    inventory = Inventory( 
        product_id=product.id, 
        warehouse_id=data['warehouse_id'], 
        quantity=data['initial_quantity'] 
    ) 
     
    db.session.add(inventory)

    #One commit for both , from here easily possible to going back to previous state.
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        return {"message":"Failed to create product and inventory"},500
     
    return {"message": "Product created", "product_id": product.id},201 