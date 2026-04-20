import { CognitoUserPool } from "amazon-cognito-identity-js"

const poolData = {
    UserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID!,
    ClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!,
}

export const userPool = new CognitoUserPool(poolData)
