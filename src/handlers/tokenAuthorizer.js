const { allow, deny} = require("../lib/policy")

exports.handler = async (event) => {
    try {
        if (!event.type == "TOKEN") throw new Error(`Evento do tipo [${event.type}] não suportado`)
        return allow("customer-cpf", event.methodArn)
    } catch (error) {
        console.error("Erro inesperado", error)
        return deny(event.methodArn)
    }
}
