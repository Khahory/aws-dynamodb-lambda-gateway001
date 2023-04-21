ENVIRONMENT
- node v16
- SDK AWS V2
- FILES NEED BE JS

Build a CRUD Serverless API with AWS Lambda, API Gateway and a DynamoDB from Scratch
https://www.youtube.com/watch?v=Ut5CkSz6NR0&t=146s

#### We neeed 
- create a database dynamodb
- create a lambda function
            create rol with (AmazonDynamoDBFullAccess, CloudWatchLogsFullAccess) policies 
- configure the lambda function to access the database with IAM role
- create an REST API Gateway  to 
            access the lambda function
            handle the request and response
            create resources, enable CORS, create methods, check proxy integration
- create handler code to perform the CRUD operations
![img.png](docs%2Fimg.png)