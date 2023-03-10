import {S3} from '@aws-sdk/client-s3'


export const getS3Client = () => {
    if (!process.env.AWS_ACCESS_TOKEN || !process.env.AWS_ACCESS_SECRET) {
        throw new Error('Missing AWS credentials');
    }

    return new S3({
        endpoint: 'https://us-east-1.linodeobjects.com',
        region: 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_TOKEN,
            secretAccessKey: process.env.AWS_ACCESS_SECRET
        }
    })
}