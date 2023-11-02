const { allow, deny} = require("../lib/policy")
const { getConnection } = require("../lib/database");

exports.handler = async (event) => {
    let connection = null

    try {
        if (!event.type == "TOKEN") throw new Error(`Evento do tipo [${event.type}] não suportado`)

        const token = event.authorizationToken?.trim()
        if (!token) throw new Error("Obrigatório informar um token")

        connection = await getConnection()
        const [rows] = await connection.query("SELECT id FROM customer_ca WHERE cpf = ? LIMIT 1", [token])
        if (!rows.length) {
            console.error(`Cliente com CPF [${token}] não encontrado`)
            return deny(token, event.methodArn)
        }

        const customerId = rows[0].id.toString()
        return allow(customerId, event.methodArn)
    } catch (error) {
        console.error("Erro inesperado", error)
        return deny("", event.methodArn)
    } finally {
        if (connection) connection.end()
    }
}
