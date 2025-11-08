import { buildProgramFromSources, loadShadersFromURLS, loadJSONFile, setupWebGL } from "../../libs/utils.js";
import { ortho, perspective, lookAt, flatten, mat4, vec4, mult, printm } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix } from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js';
import * as TORUS from '../../libs/objects/torus.js';
import * as SPHERE from '../../libs/objects/sphere.js';


function setup(shaders, sceneGraph) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // 0 -> linhas, 1-> preenchido, 2-> ambos
    let drawingMode = 2;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);
    let uColorLocation = gl.getUniformLocation(program, "u_color");
    let mProjection = ortho(-1 * aspect, aspect, -1, 1, -100, 200);
    //let mView = lookAt([2, 1.2, 1], [0, 0.6, 0], [0, 1, 0]);

    let zoom = 1.0;

    let rg = 0;
    let tankPos_Z = 0;
    let rc = 0;
    let rb = 0;
    const WHEEL_RADIUS = 0.08;
    const Z_INCREMENT = 0.01;
    const ROTATION_INCREMENT = (Z_INCREMENT * 360) / (2 * Math.PI * WHEEL_RADIUS);

    let isPerspective = false;
    let isMultiView = false;
    let currentViewID = 1;
    const mViewFront = lookAt([2, 0.6, 0], [0, 0.6, 0], [0, 1, 0]);
    const mViewTop = lookAt([0, 2, 0], [0, 0.6, 0], [-1, 0, 0]);
    const mViewLeft = lookAt([0, 0.6, 2], [0, 0.6, 0], [0, 1, 0]);
    //const mViewOblique = lookAt([2, 1.2, 1], [0, 0.6, 0], [0, 1, 0]);

    let mViewAxonometric;
    let isView4Oblique = false;

    let obliqueL = 0.5;
    let obliqueAlpha = 45.0;

    let axonometricAzimuth = 75.0;
    let axonometricElevation = 10.0;
    let axonometricDist = 10.0;

    const view4At = [0, 0.6, 0];
    const view4Up = [0, 1, 0];

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function (event) {
        switch (event.key) {
            case '0':
                //altera modo de vista 
                isMultiView = !isMultiView;
                break;
            case '1':
                //vista frontal
                currentViewID = 1;
                isMultiView = false;
                break;
            case '2':
                ///vista para esquerda
                currentViewID = 2;
                isMultiView = false;
                break;
            case '3':
                //vista para cima
                currentViewID = 3;
                isMultiView = false;
                break;
            case '4':
                //vista obliqua
                currentViewID = 4;
                isMultiView = false;
                break;
            case '8':
                //trocar entre obliqua e axonometrica
                isView4Oblique = !isView4Oblique;
                break;
            case '9':
                isPerspective = !isPerspective;
                break;
            case ' ':
                drawingMode = (drawingMode + 1) % 3;
                break;
            case 'ArrowLeft':
                //debug
                if (currentViewID === 4 && isView4Oblique) {
                    //diminui alpha
                    obliqueAlpha -= 1;
                } else if (currentViewID === 4 && !isView4Oblique) {
                    //diminui rotacao Y
                    axonometricAzimuth -= 1;
                }
                event.preventDefault();
                break;
            case 'ArrowRight':
                if (currentViewID === 4 && isView4Oblique) {
                    //aumenta alpha
                    obliqueAlpha += 1;
                } else if (currentViewID === 4 && !isView4Oblique) {
                    //aumenta rotacao Y
                    axonometricAzimuth += 1;
                }
                event.preventDefault();
                break;
            case 'ArrowUp':
                if (currentViewID === 4 && isView4Oblique) {
                    //aumenta l
                    obliqueL = Math.min(2.0, obliqueL + 0.1);
                } else if (currentViewID === 4 && !isView4Oblique) {
                    //aumenta rotacao X
                    axonometricElevation = Math.min(89.0, axonometricElevation + 1);
                }
                event.preventDefault();
                break;
            case 'ArrowDown':
                if (currentViewID === 4 && isView4Oblique) {
                    //diminui l
                    obliqueL = Math.max(0.1, obliqueL - 0.1);
                } else if (currentViewID === 4 && !isView4Oblique) {
                    //diminui rotacao X
                    axonometricElevation = Math.max(-89.0, axonometricElevation - 1);
                }
                event.preventDefault();
                break;
            case 'q':
                rg += ROTATION_INCREMENT;
                tankPos_Z += Z_INCREMENT;
                break;
            case 'e':
                rg -= ROTATION_INCREMENT;
                tankPos_Z -= Z_INCREMENT;
                break;
            case 'w':
                rc = Math.min(30, rc + 1);
                break;
            case 's':
                rc = Math.max(0, rc - 1);
                break;
            case 'a':
                //esquerda
                rb = Math.max(-100, rb - 2);
                break;
            case 'd':
                //direita
                rb = Math.min(100, rb + 2);
                break;
            case 'r':
                zoom = 1.0;
                isPerspective = false;
                isView4Oblique = false;
                obliqueL = 0.5;
                obliqueAlpha = 45.0;
                axonometricAzimuth = 75.0;
                axonometricElevation = 10.0;
                axonometricDist = 10.0;
                rg = 0;
                tankPos_Z = 0;
                rb = 0;
                rc = 0;

        }
    }

    canvas.addEventListener("wheel", function (event) {
        event.preventDefault();
        let zoomAmount;
        if (event.deltaY > 0) {
            zoomAmount = 1.1;
        } else {
            zoomAmount = 0.9;
        }
        zoom *= zoomAmount;
        zoom = Math.max(0.1, Math.min(zoom, 20.0));
    });

    gl.clearColor(0.53, 0.81, 0.92, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    CUBE.init(gl);
    CYLINDER.init(gl);
    TORUS.init(gl);
    SPHERE.init(gl);

    window.requestAnimationFrame(render);


    function resize_canvas(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

    }

    const primitives = {
        "CUBE": CUBE,
        "CYLINDER": CYLINDER,
        "TORUS": TORUS,
        "SPHERE": SPHERE
    }
    function getMode(modeID) {
        if (modeID === 0) {
            return gl.LINES;
        } else {
            return gl.TRIANGLES;
        }
    }
    function drawPrimitiveInBothModes(primitive, fillColor) {
        //preenchimento
        gl.uniform4fv(uColorLocation, fillColor);
        primitive.draw(gl, program, gl.TRIANGLES);
        //linhas pretas
        gl.uniform4fv(uColorLocation, [0.0, 0.0, 0.0, 1.0]);
        //para nao ocultar as linhas
        gl.depthMask(false);
        primitive.draw(gl, program, gl.LINES);
        gl.depthMask(true);
    }


    function drawGround() {
        const tileSize = 0.5;
        const numTiles = 20;

        const dark = [0.2, 0.2, 0.2, 1.0];
        const light = [0.8, 0.8, 0.8, 1.0];

        pushMatrix();
        for (let i = -numTiles / 2; i < numTiles / 2; i++) {
            for (let j = -numTiles / 2; j < numTiles / 2; j++) {
                pushMatrix();
                let color = light;
                if ((i + j) % 2 === 0) {
                    color = dark
                }
                //-0.005 para descer
                multTranslation([i * tileSize + tileSize / 2, -0.006, j * tileSize + tileSize / 2]);
                multScale([tileSize, 0.01, tileSize]);
                uploadModelView();
                if (drawingMode === 2) {
                    drawPrimitiveInBothModes(primitives["CUBE"], color);
                } else {
                    gl.uniform4fv(uColorLocation, color);
                    primitives["CUBE"].draw(gl, program, getMode(drawingMode));
                }
                popMatrix();
            }
        }
        popMatrix();
    }



    function traverse(node) {
        pushMatrix();

        const t = node.transforms.translation;
        const r = node.transforms.rotation;
        const s = node.transforms.scale;

        let dynamicRotation = [r[0], r[1], r[2]];
        let dynamicTranslation = [t[0], t[1], t[2]];

        if (node.name === "tank") {
            dynamicTranslation[2] += tankPos_Z;
        }
        if (node.name.startsWith("wheel_") || node.name.startsWith("axle_") || node.name.startsWith("cap_")) {
            //tive que inverter e mudar para o Y
            dynamicRotation[1] -= rg;
        }
        if (node.name === "cannonAssembly") {
            //inverti
            dynamicRotation[0] -= rc;
        }
        if (node.name === "cabin") {
            //inverti
            dynamicRotation[1] -= rb;
        }

        multTranslation(dynamicTranslation);
        multRotationZ(dynamicRotation[2]);
        multRotationY(dynamicRotation[1]);
        multRotationX(dynamicRotation[0]);
        multScale(s);

        if (node.type === "leaf") {
            let color = node.color;
            uploadModelView();

            if (drawingMode === 2) {
                drawPrimitiveInBothModes(primitives[node.primitive], color);
            } else {
                gl.uniform4fv(uColorLocation, color);
                primitives[node.primitive].draw(gl, program, getMode(drawingMode));
            }
        }
        else if (node.type === "internal" && node.children) {
            for (const child of node.children) {
                traverse(child);
            }
        }
        popMatrix();
    }

    function uploadProjection() {
        uploadMatrix("u_projection", mProjection);
    }

    function uploadModelView() {
        uploadMatrix("u_model_view", modelView());
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }
    function drawScene(viewMatrix) {
        //criar a cena
        loadMatrix(viewMatrix);
        drawGround();
        traverse(sceneGraph);
    }

    function getProjectionMatrix(currentAspect) {
        //fazer a projecao
        if (isPerspective) {
            const fovy = Math.max(5, Math.min(120, 60 * zoom));
            return perspective(fovy, currentAspect, 0.01, 100);
        } else {
            return ortho(-currentAspect * zoom, currentAspect * zoom, -zoom, zoom, -100, 200);
        }
    }

    function render() {
        window.requestAnimationFrame(render);
        console.log(`View: ${currentViewID} | isOblique: ${isView4Oblique} | Axon(Az: ${axonometricAzimuth}, El: ${axonometricElevation}) | Oblique(L: ${obliqueL}, A: ${obliqueAlpha})`);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

        const w = canvas.width;
        const h = canvas.height;


        //converter para rad
        const azRad = axonometricAzimuth * Math.PI / 180.0;
        const elRad = axonometricElevation * Math.PI / 180.0;
        //calcular eye
        const eyeX = view4At[0] + axonometricDist * Math.cos(elRad) * Math.sin(azRad);
        const eyeY = view4At[1] + axonometricDist * Math.sin(elRad);
        const eyeZ = view4At[2] + axonometricDist * Math.cos(elRad) * Math.cos(azRad);
        //vista axonometrica
        mViewAxonometric = lookAt([eyeX, eyeY, eyeZ], view4At, view4Up);
        //multivista
        if (isMultiView) {
            const w2 = w / 2;
            const h2 = h / 2;
            const viewportAspect = w2 / h2;

            //cima (canto inferior esquerdo)
            gl.viewport(0, 0, w2, h2);
            mProjection = getProjectionMatrix(viewportAspect);
            uploadProjection();
            drawScene(mViewTop);

            //frontal (canto superior esquerdo)
            gl.viewport(0, h2, w2, h2);
            mProjection = getProjectionMatrix(viewportAspect);
            uploadProjection();
            drawScene(mViewFront);

            //esquerda (canto superior direito)
            gl.viewport(w2, h2, w2, h2);
            mProjection = getProjectionMatrix(viewportAspect);
            uploadProjection();
            drawScene(mViewLeft);

            //obliqua (canto inferior direito)
            gl.viewport(w2, 0, w2, h2);
            let baseProjection = getProjectionMatrix(viewportAspect);
            if (isView4Oblique) {
                console.log("DEBUG: A desenhar VISTA OBLÍQUA"); // <--- ADICIONE ESTE
                const alphaRad = obliqueAlpha * Math.PI / 180;
                const c = Math.cos(alphaRad);
                const s = Math.sin(alphaRad);
                const z_center = -2.0;

                const mObliqueShear = mat4(
                    //x' = x - z*l*c + (z_center*l*c) <-- Compensação
                    vec4(1, 0, -obliqueL * c, obliqueL * c * z_center),
                    //y' = y - z*l*s + (z_center*l*s) <-- Compensação
                    vec4(0, 1, -obliqueL * s, obliqueL * s * z_center),
                    vec4(0, 0, 1, 0),
                    vec4(0, 0, 0, 1)
                );
                mProjection = mult(baseProjection, mObliqueShear);
                uploadProjection();
                drawScene(mViewFront);
            } else {
                console.log("DEBUG: A desenhar VISTA AXONOMÉTRICA"); // <--- ADICIONE ESTE
                mProjection = baseProjection;
                uploadProjection();
                drawScene(mViewAxonometric);
            }
        } else {
            //vista unica (ecra inteiro)
            gl.viewport(0, 0, w, h);
            let currentView;
            let currentProjection = getProjectionMatrix(aspect);

            switch (currentViewID) {
                case 1:
                    currentView = mViewFront;
                    break;
                case 2:
                    currentView = mViewLeft;
                    break;
                case 3:
                    currentView = mViewTop;
                    break;
                case 4:
                    if (isView4Oblique) {
                        const alphaRad = obliqueAlpha * Math.PI / 180;
                        const c = Math.cos(alphaRad);
                        const s = Math.sin(alphaRad);
                        const z_center = -2.0;

                        const mObliqueShear = mat4(
                            // x' = x - z*l*c + (z_center*l*c) <-- Compensação
                            vec4(1, 0, -obliqueL * c, obliqueL * c * z_center),
                            // y' = y - z*l*s + (z_center*l*s) <-- Compensação
                            vec4(0, 1, -obliqueL * s, obliqueL * s * z_center),
                            vec4(0, 0, 1, 0),
                            vec4(0, 0, 0, 1)
                        );
                        currentProjection = mult(currentProjection, mObliqueShear);
                        currentView = mViewFront;
                    } else {
                        currentView = mViewAxonometric;
                    }
                    break;
            }
            mProjection = currentProjection;
            uploadProjection();
            drawScene(currentView);
        }
    }
}
const shader_urls = ["shader.vert", "shader.frag"];
const scene_url = "scene.json";

loadShadersFromURLS(shader_urls).then(shaders => {
    loadJSONFile(scene_url).then(sceneData => {
        setup(shaders, sceneData);
    });
});