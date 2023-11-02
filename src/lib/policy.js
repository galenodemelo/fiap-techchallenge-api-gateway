function generatePolicy(effect, principalId, resource) {
    if (!effect) throw new Error("Obrigatório informar Allow ou Deny para liberar ou não o recurso")
    if (!resource) throw new Error("Obrigatório informar ARN do recurso")

    return {
        principalId: principalId,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    }
}

exports.allow = (principalId, resource) => {
    return generatePolicy("Allow", principalId, resource)
}

exports.deny = (resource) => {
    return generatePolicy("Deny", null, resource)
}
