const { reject } = require('async');
const aws = require('aws-sdk');

// Creates a connection to Amazon S3 using IAM user credentials
const connection = new aws.S3({
    accessKeyId: process.env.AWS_IAM_ACCESS_KEY_ID,
    secretAccessKey: process.env. AWS_IAM_SECRET_ACCESS_KEY
});

// Returns an authenticated connection to the Amazon S3 storage
module.exports.S3 = connection;

// Creates an S3 bucket with the passed in bucket name and with the specified access control type
// Returns a promise to indicate whether the task was successful or was rejected
module.exports.createBucket = (bucketName, aclType) => {
    bucketParams = {
        Bucket: bucketName,
        ACL: aclType
    }
    return new Promise((resolve, reject) => {
        connection.createBucket(bucketParams, (err, data) => {
            if(err) reject(false);
            else resolve(true);
        });
    });
}

module.exports.getObject = (bucketName, key) =>{
    param={
        Bucket: bucketName,
        key: key
    }
    return new Promise((resolve,reject) =>{
        connection.getObject(param,(err,data)=>{
            if(err) reject(false);
            else resolve(true);
        });
    });
}