const AWS = require('aws-sdk');

// API: https://pzk6u9em33.execute-api.us-east-1.amazonaws.com/prod

// Set the region
AWS.config.update({region: 'us-east-1'});

// Create dynamodb document client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Table info and paths
const dynamodbTableName = 'product-inventory';
const healthPath = '/health';
const productPath = '/product';
const productsPath = '/products';

// Lambda handler
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    let response;

    switch (true) {
        /*
        * Health check
        * GET /health
        * healthPath = '/health', so this case will be true if the path is '/health'
         */

        // get method for health check
        case event.httpMethod === 'GET' && event.path === healthPath:
            response = buildResponse(200);
            break;

        // get method for getting a product
        case event.httpMethod === 'GET' && event.path === productPath:
            response = await getProduct(event.queryStringParameters.product_id);
            break;

        // get method for getting all products
        case event.httpMethod === 'GET' && event.path === productsPath:
            response = await getProducts();
            break;

        // post method for creating a product
        case event.httpMethod === 'POST' && event.path === productPath:
            response = await saveProduct(JSON.parse(event.body));
            break;

        // patch method for updating a product
        case event.httpMethod === 'PATCH' && event.path === productPath:
            const requestBody = JSON.parse(event.body);
            response = await updateProduct(requestBody.product_id, requestBody.updateKey, requestBody.updateValue);
            break;

        // delete method for deleting a product
        case event.httpMethod === 'DELETE' && event.path === productPath:
            response = await deleteProduct(JSON.parse(event.body).product_id);
            break;

        // default response
        default:
            response = buildResponse(404, 'Not found');
    }

    return response;
}

// Get product by id
async function getProduct(product_id) {
    // Get product from dynamodb
    const params = {
        TableName: dynamodbTableName,
        Key: {
            product_id,
        },
    };
    // Return product
    return await dynamodb.get(params).promise().then(response => {
        return buildResponse(200, response.Item);
    }, error => {
        console.log('Error getting product: ', error);
    })
}

// Get all products
async function getProducts() {
    // Get products from dynamodb
    const params = {
        TableName: dynamodbTableName
    };
    // Return products
    const allProducts = await scanDynamoRecords(params, []);
    const body = {
        products: allProducts
    }
    return buildResponse(200, body);
}

// scanDynamoRecords function
async function scanDynamoRecords(scanParams, itemArray) {
    try {
        // Scan dynamodb table
        const dynamoData = await dynamodb.scan(scanParams).promise();

        // Add items to array
        itemArray = itemArray.concat(dynamoData.Items);

        // If there is more data, keep scanning
        if (dynamoData.LastEvaluatedKey) {
            // Set the start key to continue scanning
            scanParams.ExclusiveStartKey = dynamoData.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }

        // Return all items
        return itemArray;
    } catch (error) {
        console.error('Error scanning dynamodb table: ', error);
    }
}

// Save product
async function saveProduct(requestBody) {
    // Save product to dynamodb
    const params = {
        TableName: dynamodbTableName,
        Item: requestBody,
    };
    // Return product
    return await dynamodb.put(params).promise().then(() => {
        // Build response
        const body = {
            Operation: 'SAVE',
            Message: 'Product saved successfully',
            Item: requestBody,
        }

        // Return response
        return buildResponse(200, body);
    }, error => {
        console.error('Error saving product: ', error);
    })
}

// Update product
async function updateProduct(product_id, updateKey, updateValue) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            product_id,
        },
        UpdateExpression: `set ${updateKey} = :value`, // a string representing the attribute being updated
        ExpressionAttributeValues: { // a map of substitutions for all attribute values
            ':value': updateValue,
        },
        ReturnValues: 'UPDATED_NEW', // indicates what data should be returned from the update operation
    }

    // Update product
    return await dynamodb.update(params).promise().then((response) => {
        const body = {
            Operation: 'UPDATE',
            Message: 'Product updated successfully',
            UpdatedAttributes: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error('Error updating product: ', error);
    })
}

// Delete product
async function deleteProduct(product_id) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
            product_id,
        },
        ReturnValues: 'ALL_OLD', // indicates what data should be returned from the delete operation
    }

    // Delete product
    return await dynamodb.delete(params).promise().then((response) => {
        const body = {
            Operation: 'DELETE',
            Message: 'Product deleted successfully',
            Item: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error('Error deleting product: ', error);
    })
}


// Build response
function buildResponse(statusCode, body) {
    return {
        statusCode,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
        },
    };
}