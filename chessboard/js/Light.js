class Light extends UniformProvider{
    constructor(id, ...programs){
        super(`lights[${id}]`);
        this.addComponentsAndGatherUniforms(...programs);
    }
}