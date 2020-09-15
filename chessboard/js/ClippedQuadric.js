class ClippedQuadric extends UniformProvider {
    constructor(id, ...programs) {
      super(`clippedQuadrics[${id}]`);
      this.addComponentsAndGatherUniforms(...programs);
    }

    makeUnitCylinder() {
        this.surface.set(
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, -1);
        this.clipper1.set(
            0, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1);
        this.clipper2.set(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1);
    }

    makeUnitSphere() {
        this.surface.set(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, -1
        );
        this.clipper1.set(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1
        );
        this.clipper2.set(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1
        );
    }

    makeUnitCone() {
        this.surface.set(
            1, 0, 0, 0,
            0, -1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 0);
        this.clipper1.set(
            0, 0, 0, 0,
            0, 1, 0, 1,
            0, 0, 0, 0,
            0, 0, 0, 0);
        this.clipper2.set(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1
        );
    }
    makeUnitParaboloid() {
        this.surface.set(
            1, 0, 0, 0,
            0, 0, 0, -1,
            0, 0, 1, 0,
            0, 0, 0, 0);
        this.clipper1.set(
            0, 0, 0, 0,
            0, 1, 0, -1,
            0, 0, 0, 0,
            0, 0, 0, 0);
        this.clipper2.set(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1
        );
    }
    makeUnitRookHead() {
        this.surface.set(
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1);
        this.clipper1.set(
            0, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1);
        this.clipper2.set(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, -1
        );
    }
    makeUnitSquare() {
        this.surface.set(
            0, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1);
        this.clipper1.set(
            1, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, -1);
        this.clipper2.set(
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, -1
        );
    }
    //matrix transformation
    transformSurfaceAndClipper(T){
        T.invert();
        this.surface.premul(T);
        this.clipper1.premul(T);
        this.clipper2.premul(T);
        T.transpose();
        this.surface.mul(T);
        this.clipper1.mul(T);
        this.clipper2.mul(T);
    }
    transformSurface(T){
        T.invert();
        this.surface.premul(T);
        T.transpose();
        this.surface.mul(T);
    }
    transformClipper(T){
        T.invert();
        this.clipper1.premul(T);
        this.clipper2.premul(T);
        T.transpose();
        this.clipper1.mul(T);
        this.clipper2.mul(T);
    }

    scaleQuadric(sx, sy, sz, type){
        let T = new Mat4(
                sx, 0,  0,  0,
                0, sy,  0,  0,
                0,  0, sz,  0,
                0,  0,  0,  1,
            );
        
        if(type == 0){
            this.transformSurfaceAndClipper(T);
        }else if(type == 1){
            this.transformSurface(T);
        }else{
            this.transformClipper(T);
        }
    }

    rotateQuadric(roll, pitch, yaw, type){
        let T1 = new Mat4(
            1, 0, 0, 0,
            0, Math.cos(roll), Math.sin(roll), 0,
            0, -Math.sin(roll),  Math.cos(roll), 0,
            0, 0, 0, 1
        );
        let T2 = new Mat4(
            Math.cos(pitch), 0, -Math.sin(pitch), 0,
            0, 1, 0, 0,
            Math.sin(pitch), 0, Math.cos(pitch), 0,
            0, 0, 0, 1
        );
        let T3 = new Mat4(
            Math.cos(yaw), Math.sin(yaw), 0, 0,
            -Math.sin(yaw), Math.cos(yaw), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );

        if(type == 0){
            this.transformSurfaceAndClipper(T1);
            this.transformSurfaceAndClipper(T2);
            this.transformSurfaceAndClipper(T3);
        }else if(type == 1){
            this.transformSurface(T1);
            this.transformSurface(T2);
            this.transformSurface(T3);
        }else{
            this.transformClipper(T1);
            this.transformClipper(T2);
            this.transformClipper(T3);
        }
    }

    translateQuadric(dx, dy, dz, type){
        let T = new Mat4(
                1, 0, 0,  0,
                0, 1, 0,  0,
                0, 0, 1,  0,
                dx, dy, dz,  1,
            );
        if(type == 0){
            this.transformSurfaceAndClipper(T);
        }else if(type == 1){
            this.transformSurface(T);
        }else{
            this.transformClipper(T);
        }
    }
}