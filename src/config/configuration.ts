export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    jwt: {
        secret: process.env.JWT_SECRET,
        expiration: process.env.JWT_EXPIRATION || '1d',
    },
    database: {
        url: process.env.DATABASE_URL,
    },
});