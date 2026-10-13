// Detalhes da biblioteca para cada exercício do catálogo: regiões trabalhadas, como fazer (3 passos curtos)
// e erros comuns. Conteúdo próprio. O Gabriel tem leg press, extensora, flexora, polia, halteres e barra.
// Sem importações com alias (mesmo padrão do catálogo).

export type RegiaoCorpo =
  | "Tornozelo"
  | "Fibulares"
  | "Panturrilha"
  | "Posterior de coxa"
  | "Quadríceps"
  | "Glúteo"
  | "Adutores"
  | "Quadril"
  | "Core"
  | "Oblíquos"
  | "Lombar"
  | "Peito"
  | "Costas"
  | "Ombros"
  | "Tríceps"
  | "Bíceps"
  | "Coordenação";

export const REGIOES_CORPO: RegiaoCorpo[] = [
  "Tornozelo",
  "Fibulares",
  "Panturrilha",
  "Posterior de coxa",
  "Quadríceps",
  "Glúteo",
  "Adutores",
  "Quadril",
  "Core",
  "Oblíquos",
  "Lombar",
  "Peito",
  "Costas",
  "Ombros",
  "Tríceps",
  "Bíceps",
  "Coordenação",
];

export type DetalheExercicio = {
  regioes: RegiaoCorpo[];
  passos: [string, string, string];
  erros: string[];
};

const d = (regioes: RegiaoCorpo[], passos: [string, string, string], erros: string[]): DetalheExercicio => ({
  regioes,
  passos,
  erros,
});

export const DETALHES: Record<string, DetalheExercicio> = {
  // ------------------------------------------------------------ tornozelo: mobilidade
  "joelho-parede": d(
    ["Tornozelo", "Panturrilha"],
    [
      "Fique de frente para a parede, com o pé a um palmo dela.",
      "Leve o joelho para a frente até tocar a parede, calcanhar no chão.",
      "Volte devagar e repita; afaste o pé quando ficar fácil.",
    ],
    [
      "Tirar o calcanhar do chão.",
      "Deixar o joelho cair para dentro.",
      "Fazer com pressa, sem controlar a volta.",
    ],
  ),
  "alongamento-panturrilha-degrau": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Apoie a ponta do pé na beira do degrau e segure em algo.",
      "Deixe o calcanhar descer devagar até sentir esticar.",
      "Segure com o joelho esticado e depois com o joelho dobrado.",
    ],
    ["Balançar para forçar mais.", "Ir até doer.", "Deixar o tornozelo virar para fora."],
  ),
  "circulos-tornozelo": d(
    ["Tornozelo"],
    [
      "Sente com a perna estendida e o pé no ar.",
      "Desenhe círculos grandes com a ponta do pé, só o tornozelo mexendo.",
      "Faça para um lado e depois para o outro.",
    ],
    ["Mexer a perna inteira em vez do tornozelo.", "Círculos pequenos e rápidos."],
  ),

  // ------------------------------------------------------------ tornozelo: força
  "el-fora": d(
    ["Fibulares", "Tornozelo"],
    [
      "Sentado, prenda o elástico do lado de dentro do pé, perna esticada.",
      "Leve o pé para fora contra o elástico, sem girar a perna.",
      "Volte contando 3 segundos.",
    ],
    [
      "Girar o quadril em vez do tornozelo.",
      "Soltar o elástico de uma vez na volta.",
      "Elástico frouxo demais.",
    ],
  ),
  "el-dentro": d(
    ["Tornozelo", "Panturrilha"],
    [
      "Prenda o elástico do lado de fora do pé, perna esticada.",
      "Leve a planta do pé para dentro contra o elástico.",
      "Volte devagar, contando 3 segundos.",
    ],
    ["Girar a perna junto.", "Movimento curto e rápido."],
  ),
  "el-cima": d(
    ["Tornozelo"],
    [
      "Prenda o elástico à frente, passando pelo peito do pé.",
      "Puxe a ponta do pé em sua direção.",
      "Volte devagar até a posição inicial.",
    ],
    ["Dobrar o joelho para ajudar.", "Deixar o elástico puxar o pé de volta rápido."],
  ),
  "el-baixo": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Segure as pontas do elástico, passando pela sola do pé.",
      "Empurre a ponta do pé para baixo, como num acelerador.",
      "Volte devagar, contando 3 segundos.",
    ],
    ["Tirar a perna do lugar.", "Fazer só meia amplitude."],
  ),
  "isometria-eversao-parede": d(
    ["Fibulares", "Tornozelo"],
    [
      "Em pé ou sentado, encoste a borda de fora do pé na parede.",
      "Empurre a parede para fora, sem mexer o pé.",
      "Segure o tempo indicado e solte devagar.",
    ],
    ["Prender a respiração.", "Empurrar com dor acima de 3."],
  ),
  "pant-degrau": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Fique com a ponta dos pés na beira do degrau, segurando em algo.",
      "Suba na ponta dos pés até o alto.",
      "Desça contando 3 segundos, até o calcanhar passar um pouco do degrau.",
    ],
    ["Descer rápido.", "Tornozelo virar para fora no alto.", "Dobrar os joelhos para ajudar."],
  ),
  "pant-um-pe": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Apoie só o pé direito, segurando em algo para o equilíbrio.",
      "Suba na ponta do pé o mais alto que conseguir.",
      "Desça devagar; repita com o joelho dobrado.",
    ],
    ["Subir só até a metade.", "Usar a mão para puxar o corpo.", "Tornozelo cair para fora."],
  ),
  "pant-um-pe-carga": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Segure um halter do lado da perna que trabalha.",
      "Suba na ponta de um pé só, no degrau.",
      "Desça contando 3 segundos.",
    ],
    ["Carga alta demais e amplitude curta.", "Balançar o tronco."],
  ),
  "pant-descida-lenta": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Suba na ponta dos dois pés no degrau.",
      "Tire um pé e desça só com o outro, contando 4 segundos.",
      "Volte a subir com os dois pés.",
    ],
    ["Descer rápido no fim.", "Subir com um pé só (o objetivo é a descida)."],
  ),
  "caminhada-pontas": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Suba na ponta dos pés, bem alto.",
      "Caminhe em linha reta sem baixar os calcanhares.",
      "Mantenha o tronco alto e os passos curtos.",
    ],
    ["Calcanhar baixando no meio do caminho.", "Joelhos dobrados demais."],
  ),
  "eq-um-pe": d(
    ["Tornozelo", "Fibulares", "Glúteo"],
    [
      "Fique em um pé só, joelho levemente dobrado.",
      "Olhe para um ponto fixo e mantenha o quadril nivelado.",
      "Segure o tempo indicado; perto de uma parede no começo.",
    ],
    ["Travar o joelho esticado.", "Quadril caindo para um lado.", "Olhar para baixo."],
  ),
  "eq-olhos-fechados": d(
    ["Tornozelo", "Fibulares", "Coordenação"],
    [
      "Fique em um pé só ao lado de uma parede.",
      "Feche os olhos e segure o equilíbrio.",
      "Se perder, abra os olhos, apoie e recomece.",
    ],
    ["Fazer longe de um apoio.", "Contar como certo mesmo tocando o pé no chão."],
  ),
  "eq-almofada-simples": d(
    ["Tornozelo", "Fibulares"],
    [
      "Suba com um pé na almofada (ou travesseiro dobrado).",
      "Joelho levemente dobrado, olhar à frente.",
      "Segure o tempo, corrigindo com o tornozelo.",
    ],
    ["Travar o joelho.", "Usar os braços o tempo todo para não cair."],
  ),
  "eq-almofada": d(
    ["Tornozelo", "Fibulares", "Coordenação"],
    [
      "Em um pé na almofada, de frente para a parede.",
      "Passe a bola com as mãos contra a parede e receba.",
      "Mantenha o pé firme enquanto a bola vai e volta.",
    ],
    ["Tirar o olho da bola e perder a base.", "Ficar longe demais da parede."],
  ),
  "eq-perturbacao": d(
    ["Tornozelo", "Fibulares", "Core"],
    [
      "Fique em um pé só com o joelho levemente dobrado.",
      "Peça para alguém dar toques leves nos ombros, ou puxe um elástico.",
      "Recupere o equilíbrio sem tirar o pé.",
    ],
    ["Toques fortes demais no começo.", "Travar o corpo todo em vez de corrigir no tornozelo."],
  ),
  "alcance-multidirecional": d(
    ["Tornozelo", "Glúteo", "Quadríceps"],
    [
      "Apoie o pé direito no centro e dobre o joelho.",
      "Toque o outro pé à frente, ao lado e atrás, o mais longe que der.",
      "Volte ao centro sem apoiar o pé que alcança.",
    ],
    ["Joelho caindo para dentro.", "Apoiar o peso no pé que alcança."],
  ),
  "saltinhos-lugar": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Fique na ponta dos pés, joelhos quase esticados.",
      "Dê saltinhos curtos e rápidos no lugar.",
      "Aterrisse macio, sempre na ponta dos pés.",
    ],
    ["Saltar alto demais.", "Bater o calcanhar no chão.", "Barulho alto na aterrissagem."],
  ),
  "salto-bipodal-aterrissagem": d(
    ["Tornozelo", "Quadríceps", "Glúteo"],
    [
      "Pés na largura do quadril, joelhos levemente dobrados.",
      "Salte para a frente com os dois pés.",
      "Aterrisse macio e segure 2 segundos parado.",
    ],
    ["Joelhos caindo para dentro.", "Aterrissar com as pernas esticadas.", "Emendar saltos sem parar."],
  ),
  "salto-aterrissagem": d(
    ["Tornozelo", "Quadríceps", "Glúteo"],
    [
      "Fique em um pé só, joelho levemente dobrado.",
      "Salte para a frente e aterrisse no mesmo pé.",
      "Segure 2 segundos parado antes do próximo.",
    ],
    ["Joelho caindo para dentro.", "Aterrisse duro, com a perna esticada.", "Não parar na aterrissagem."],
  ),
  "salto-lateral": d(
    ["Tornozelo", "Fibulares", "Glúteo"],
    [
      "Fique sobre o pé direito.",
      "Salte de lado para o pé esquerdo e volte.",
      "Aterrisse estável antes de saltar de novo.",
    ],
    ["Tornozelo virando na aterrissagem.", "Ir rápido antes de ficar estável."],
  ),
  "zigue-zague-lento": d(
    ["Tornozelo", "Quadril", "Coordenação"],
    [
      "Monte 5 a 6 cones em zigue-zague.",
      "Passe pelos cones devagar, com passos curtos.",
      "Abaixe o corpo um pouco em cada troca de direção.",
    ],
    ["Correr reto entre os cones.", "Cruzar as pernas na troca."],
  ),
  "mudanca-direcao": d(
    ["Tornozelo", "Quadríceps", "Glúteo"],
    [
      "Corra 5 m em ritmo moderado.",
      "Freie com passos curtos e corpo baixo.",
      "Mude de direção e saia de novo.",
    ],
    ["Frear com a perna esticada.", "Girar sobre o pé parado."],
  ),
  "giros-com-bola": d(
    ["Tornozelo", "Quadril", "Coordenação"],
    [
      "Conduza a bola devagar.",
      "Gire o corpo com a bola, protegendo com o pé de apoio firme.",
      "Saia para o outro lado e repita.",
    ],
    ["Girar com o pé de apoio travado.", "Perder a bola de vista."],
  ),

  // ------------------------------------------------------------ posterior de coxa
  stiff: d(
    ["Posterior de coxa", "Glúteo", "Lombar"],
    [
      "Segure a barra ou os halteres à frente das coxas, joelhos levemente dobrados.",
      "Leve o quadril para trás e desça a barra rente às pernas, coluna reta.",
      "Volte empurrando o quadril para a frente.",
    ],
    ["Arredondar as costas.", "Dobrar demais os joelhos (vira agachamento).", "Barra longe das pernas."],
  ),
  "stiff-unilateral": d(
    ["Posterior de coxa", "Glúteo", "Tornozelo"],
    [
      "Fique em uma perna, halter na mão do lado oposto.",
      "Incline o tronco e leve a outra perna para trás, em linha.",
      "Volte devagar, sem girar o quadril.",
    ],
    ["Abrir o quadril para o lado.", "Costas arredondadas.", "Pressa na volta."],
  ),
  "ponte-gluteo": d(
    ["Glúteo", "Posterior de coxa", "Core"],
    [
      "Deite de costas, joelhos dobrados e pés no chão.",
      "Suba o quadril até alinhar joelhos, quadril e ombros.",
      "Segure 1 segundo no alto e desça devagar.",
    ],
    ["Arquear a lombar no alto.", "Empurrar com a ponta dos pés."],
  ),
  "ponte-flexao-joelho": d(
    ["Posterior de coxa", "Glúteo"],
    [
      "Deite de costas com os calcanhares sobre uma toalha ou slider.",
      "Suba o quadril e puxe os calcanhares em direção ao glúteo.",
      "Estique as pernas devagar, mantendo o quadril no alto.",
    ],
    ["Deixar o quadril cair na volta.", "Puxar rápido e sem controle."],
  ),
  flexora: d(
    ["Posterior de coxa"],
    [
      "Na máquina flexora, apoie o rolo logo acima do calcanhar.",
      "Dobre os joelhos levando o rolo em direção ao glúteo.",
      "Volte devagar, contando 3 segundos (ou faça com elástico ou slider).",
    ],
    ["Tirar o quadril do banco.", "Soltar o peso na volta.", "Carga que tira a amplitude."],
  ),
  "nordica-assistida": d(
    ["Posterior de coxa"],
    [
      "Ajoelhe com os calcanhares presos e um elástico preso ao peito.",
      "Incline o corpo para a frente bem devagar, quadril estendido.",
      "Use as mãos para parar a queda e volte com ajuda.",
    ],
    ["Dobrar o quadril (sentar para trás).", "Cair rápido no fim.", "Elástico fraco demais no começo."],
  ),
  "nordica-excentrica": d(
    ["Posterior de coxa"],
    [
      "Ajoelhe com os calcanhares bem presos.",
      "Desça o corpo reto o mais devagar possível.",
      "Apoie as mãos no chão e empurre para voltar.",
    ],
    ["Quebrar no quadril.", "Fazer sem ter passado pela assistida."],
  ),
  "isometria-posterior": d(
    ["Posterior de coxa", "Glúteo"],
    [
      "Deite de costas com um calcanhar sobre um banco, joelho levemente dobrado.",
      "Empurre o calcanhar contra o banco e tire o quadril do chão.",
      "Segure o tempo indicado sem dor.",
    ],
    ["Forçar com dor acima de 3.", "Prender a respiração."],
  ),

  // ------------------------------------------------------------ panturrilha
  "pant-pe-sentado": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Em pé no leg press ou no degrau, suba na ponta dos pés.",
      "Sentado, com peso nos joelhos, faça a mesma subida.",
      "Desça devagar nas duas versões.",
    ],
    ["Amplitude curta.", "Quicar no fundo."],
  ),
  "pant-excentrica": d(
    ["Panturrilha", "Tornozelo"],
    [
      "Suba na ponta dos pés no degrau com os dois pés.",
      "Desça só com um, bem devagar, até o calcanhar passar do degrau.",
      "Use os dois pés para voltar.",
    ],
    ["Descer rápido.", "Deixar o tornozelo virar."],
  ),
  pogo: d(
    ["Panturrilha", "Tornozelo"],
    [
      "Fique com os joelhos quase esticados e os pés juntos.",
      "Salte usando só os tornozelos, como uma mola.",
      "Toque o chão o mínimo de tempo possível.",
    ],
    ["Dobrar os joelhos para saltar.", "Aterrissar com o calcanhar."],
  ),

  // ------------------------------------------------------------ coxa
  "agachamento-goblet": d(
    ["Quadríceps", "Glúteo", "Core"],
    [
      "Segure um halter junto ao peito, pés na largura dos ombros.",
      "Desça sentando entre os calcanhares, peito alto.",
      "Suba empurrando o chão.",
    ],
    ["Joelhos caindo para dentro.", "Calcanhar saindo do chão.", "Tronco caindo para a frente."],
  ),
  bulgaro: d(
    ["Quadríceps", "Glúteo", "Posterior de coxa"],
    [
      "Apoie o peito do pé de trás num banco, halteres nas mãos.",
      "Desça até o joelho de trás quase tocar o chão.",
      "Suba empurrando com o pé da frente.",
    ],
    ["Pé da frente perto demais do banco.", "Joelho da frente caindo para dentro."],
  ),
  "step-up": d(
    ["Quadríceps", "Glúteo"],
    [
      "Coloque o pé inteiro no degrau ou banco.",
      "Suba empurrando com essa perna, sem impulso da de baixo.",
      "Desça devagar.",
    ],
    ["Dar impulso com o pé de trás.", "Joelho caindo para dentro."],
  ),
  "agach-isometrico-parede": d(
    ["Quadríceps", "Glúteo"],
    [
      "Encoste as costas na parede e desça até os joelhos a 90 graus.",
      "Pés à frente, joelhos alinhados com os pés.",
      "Segure o tempo indicado.",
    ],
    ["Joelhos passando muito da ponta dos pés.", "Mãos empurrando as coxas."],
  ),
  "agach-uma-perna": d(
    ["Quadríceps", "Glúteo", "Tornozelo"],
    [
      "Fique em uma perna, a outra à frente.",
      "Desça devagar até onde controlar o joelho.",
      "Suba e, no fim, dê saltinhos curtos no lugar.",
    ],
    ["Joelho caindo para dentro.", "Descer mais do que controla."],
  ),
  "hip-thrust": d(
    ["Glúteo", "Posterior de coxa"],
    [
      "Apoie as costas no banco, barra sobre o quadril (com proteção).",
      "Suba o quadril até o tronco ficar reto, queixo para baixo.",
      "Desça devagar.",
    ],
    ["Arquear a lombar.", "Pés longe demais."],
  ),
  "elev-quadril": d(
    ["Glúteo", "Posterior de coxa"],
    [
      "Deite de costas, pés no chão e braços ao lado do corpo.",
      "Suba o quadril e contraia o glúteo.",
      "Desça devagar sem encostar totalmente.",
    ],
    ["Subir com a lombar.", "Pressa."],
  ),
  "abducao-elastico": d(
    ["Glúteo", "Quadril"],
    [
      "Elástico acima dos joelhos ou no tornozelo, em pé com apoio.",
      "Leve a perna para o lado, tronco reto.",
      "Volte devagar.",
    ],
    ["Inclinar o tronco.", "Girar o pé para fora."],
  ),
  clamshell: d(
    ["Glúteo", "Quadril"],
    [
      "Deite de lado com os joelhos dobrados e elástico acima deles.",
      "Abra o joelho de cima mantendo os pés juntos.",
      "Feche devagar.",
    ],
    ["Rolar o quadril para trás.", "Separar os pés."],
  ),
  "caminhada-lateral-elastico": d(
    ["Glúteo", "Quadril"],
    [
      "Elástico acima dos joelhos, semiagachado.",
      "Dê passos para o lado sem juntar os pés.",
      "Volte para o outro lado.",
    ],
    ["Ficar em pé alto.", "Juntar os pés a cada passo."],
  ),

  // ------------------------------------------------------------ core
  prancha: d(
    ["Core", "Ombros"],
    [
      "Apoie antebraços e pontas dos pés no chão.",
      "Corpo reto da cabeça aos calcanhares, barriga firme.",
      "Respire e segure o tempo indicado.",
    ],
    ["Quadril caindo.", "Quadril alto demais.", "Prender a respiração."],
  ),
  "prancha-lateral": d(
    ["Oblíquos", "Core", "Glúteo"],
    [
      "Deite de lado, apoiado no antebraço e na lateral do pé.",
      "Suba o quadril até o corpo ficar reto.",
      "Segure e troque de lado.",
    ],
    ["Quadril caindo.", "Ombro longe do cotovelo."],
  ),
  "dead-bug": d(
    ["Core"],
    [
      "Deite de costas, braços para o teto e joelhos a 90 graus.",
      "Estique um braço e a perna oposta sem tirar a lombar do chão.",
      "Volte e troque de lado.",
    ],
    ["Lombar saindo do chão.", "Movimento rápido."],
  ),
  pallof: d(
    ["Core", "Oblíquos"],
    [
      "De lado para a polia (ou elástico), segure a alça junto ao peito.",
      "Estique os braços à frente sem deixar o tronco girar.",
      "Segure 2 segundos e volte.",
    ],
    ["Girar o tronco.", "Ficar perto demais da polia."],
  ),
  "abdominal-rotacao": d(
    ["Oblíquos", "Core"],
    [
      "Sentado, tronco inclinado para trás e pés no chão ou no ar.",
      "Gire o tronco levando as mãos de um lado ao outro.",
      "Mantenha a barriga firme.",
    ],
    ["Girar só os braços.", "Costas arredondadas."],
  ),

  // ------------------------------------------------------------ superiores
  supino: d(
    ["Peito", "Tríceps", "Ombros"],
    [
      "Deite no banco, pés firmes no chão, barra ou halteres acima do peito.",
      "Desça até perto do peito, cotovelos a 45 graus do corpo.",
      "Empurre de volta até esticar os braços.",
    ],
    ["Cotovelos abertos a 90 graus.", "Bater a barra no peito.", "Tirar o quadril do banco."],
  ),
  flexao: d(
    ["Peito", "Tríceps", "Core"],
    [
      "Mãos um pouco mais abertas que os ombros, corpo reto.",
      "Desça o peito até perto do chão.",
      "Empurre de volta sem deixar o quadril cair.",
    ],
    ["Quadril caindo.", "Cabeça indo na frente.", "Meia amplitude."],
  ),
  remada: d(
    ["Costas", "Bíceps"],
    [
      "Na polia sentado (ou com halter apoiado no banco), costas retas.",
      "Puxe a alça até a barriga, levando os cotovelos para trás.",
      "Volte devagar até esticar os braços.",
    ],
    ["Balançar o tronco.", "Subir os ombros."],
  ),
  desenvolvimento: d(
    ["Ombros", "Tríceps"],
    [
      "Sentado ou em pé, halteres na altura dos ombros.",
      "Empurre para cima até quase esticar os braços.",
      "Desça devagar.",
    ],
    ["Arquear a lombar.", "Descer pouco."],
  ),
  puxada: d(
    ["Costas", "Bíceps"],
    [
      "Na polia alta, segure a barra um pouco mais aberta que os ombros.",
      "Puxe a barra até o alto do peito, peito aberto.",
      "Volte devagar até esticar os braços (ou faça na barra fixa).",
    ],
    ["Puxar atrás da nuca.", "Jogar o corpo para trás."],
  ),

  // ------------------------------------------------------------ velocidade
  "vel-aquecimento": d(
    ["Quadril", "Panturrilha", "Posterior de coxa"],
    [
      "Faça mobilidade de quadril e tornozelo em movimento.",
      "Corra leve e faça skipping curto.",
      "Termine com 2 a 3 progressivas.",
    ],
    ["Pular direto para a velocidade máxima.", "Aquecimento curto demais."],
  ),
  skipping: d(
    ["Quadril", "Panturrilha", "Coordenação"],
    [
      "Corra no lugar ou avançando devagar, joelhos na altura do quadril.",
      "Apoie na ponta do pé, embaixo do corpo.",
      "Braços acompanham, cotovelos a 90 graus.",
    ],
    ["Tronco para trás.", "Apoiar com o calcanhar."],
  ),
  "vel-arrancadas": d(
    ["Posterior de coxa", "Glúteo", "Panturrilha", "Quadríceps"],
    [
      "Saia de várias posições: parado, de costas, depois de girar.",
      "Acelere com o corpo inclinado e passos fortes.",
      "Desacelere aos poucos depois dos 10 a 20 m.",
    ],
    ["Endireitar o corpo logo na saída.", "Pouco descanso entre as arrancadas."],
  ),
  "aceleracao-3-pontos": d(
    ["Quadríceps", "Glúteo", "Panturrilha"],
    [
      "Apoie uma mão no chão, pés afastados, peso à frente.",
      "Empurre o chão com força e saia acelerando.",
      "Mantenha a inclinação nos primeiros passos.",
    ],
    ["Levantar o tronco no primeiro passo.", "Peso para trás na posição."],
  ),
  "vel-fechamento": d(
    ["Posterior de coxa", "Quadríceps", "Coordenação"],
    [
      "Arranque com bola ou recebendo um passe.",
      "Ajuste os passos antes da bola.",
      "Finalize em velocidade.",
    ],
    ["Desacelerar demais para chutar.", "Olhar só para a bola."],
  ),

  // ------------------------------------------------------------ potência
  "salto-vertical": d(
    ["Quadríceps", "Glúteo", "Panturrilha"],
    [
      "Pés na largura do quadril, braços para trás.",
      "Desça rápido e salte o mais alto que puder, braços para cima.",
      "Aterrisse macio com os joelhos dobrados.",
    ],
    ["Joelhos caindo para dentro na aterrissagem.", "Aterrissar com a perna esticada."],
  ),
  "salto-horizontal": d(
    ["Glúteo", "Quadríceps", "Posterior de coxa"],
    [
      "Pés na largura do quadril, braços para trás.",
      "Salte o mais longe possível com os dois pés.",
      "Aterrisse parado, sem dar passo.",
    ],
    ["Aterrissar duro.", "Cair para trás."],
  ),
  "box-jump-baixo": d(
    ["Quadríceps", "Glúteo", "Panturrilha"],
    [
      "Fique a um passo da caixa baixa.",
      "Salte e aterrisse em cima, macio, com os dois pés.",
      "Desça caminhando, sem saltar para trás.",
    ],
    ["Caixa alta demais.", "Saltar para descer."],
  ),
  "arremesso-medicinal": d(
    ["Core", "Ombros", "Glúteo"],
    [
      "Segure a bola medicinal na altura do peito.",
      "Agache um pouco e estenda o corpo todo arremessando para a frente.",
      "Use quadril e braços juntos.",
    ],
    ["Arremessar só com os braços.", "Bola pesada demais."],
  ),

  // ------------------------------------------------------------ bola
  "conducao-slalom": d(
    ["Tornozelo", "Coordenação"],
    [
      "Monte cones em linha, um a dois passos de distância.",
      "Conduza a bola entre eles usando as duas partes do pé.",
      "Levante a cabeça entre um toque e outro.",
    ],
    ["Toques longos demais.", "Só olhar para a bola."],
  ),
  "controle-orientado": d(
    ["Coordenação", "Tornozelo"],
    [
      "Receba o passe contra a parede.",
      "Domine já levando a bola para o lado que vai jogar.",
      "Saia com a bola em 1 ou 2 toques.",
    ],
    ["Matar a bola parada embaixo do corpo.", "Não olhar antes de receber."],
  ),
  "giro-costas": d(
    ["Quadril", "Tornozelo", "Coordenação"],
    [
      "Receba de costas para o gol, com alguém ou um cone atrás.",
      "Proteja com o corpo e gire para o lado livre.",
      "Saia em direção ao gol.",
    ],
    ["Girar para o lado do marcador.", "Pé de apoio travado no giro."],
  ),
  "protecao-bola": d(
    ["Core", "Quadril", "Glúteo"],
    [
      "Fique de lado para o marcador, bola no pé mais longe dele.",
      "Abra os braços com cuidado e abaixe o centro do corpo.",
      "Mantenha a bola protegida por alguns segundos.",
    ],
    ["Ficar de frente para o marcador.", "Corpo alto e fácil de empurrar."],
  ),
  "tabela-parede": d(
    ["Coordenação", "Tornozelo"],
    [
      "Fique a 3 a 5 m da parede.",
      "Passe de primeira com a parte de dentro do pé.",
      "Alterne os pés e mude a distância.",
    ],
    ["Passe sem direção.", "Usar só um pé."],
  ),
  "finalizacao-primeira": d(
    ["Quadríceps", "Coordenação", "Core"],
    [
      "Peça o passe (ou use a parede).",
      "Ajuste o pé de apoio ao lado da bola.",
      "Finalize de primeira, mirando o canto.",
    ],
    ["Pé de apoio longe da bola.", "Corpo para trás e bola subindo."],
  ),

  // ------------------------------------------------------------ visão de jogo
  scan: d(
    ["Coordenação"],
    [
      "Antes de receber a bola, olhe por cima de um ombro.",
      "Olhe por cima do outro ombro.",
      "Receba já sabendo onde está o marcador.",
    ],
    ["Olhar só na hora em que a bola chega.", "Parar de correr para olhar."],
  ),
  "estudo-sem-bola": d(
    ["Coordenação"],
    [
      "Escolha um jogo e olhe só o centroavante.",
      "Observe as corridas sem bola: diagonal, atacar o espaço, voltar.",
      "Anote 2 movimentos para usar no próximo jogo.",
    ],
    ["Assistir só aos gols.", "Não anotar nada."],
  ),
  "anotacao-pos-jogo": d(
    ["Coordenação"],
    [
      "Depois do jogo, sente 5 minutos.",
      "Anote 2 decisões boas e 2 que poderiam melhorar.",
      "Releia antes do próximo jogo.",
    ],
    ["Anotar só o placar.", "Ser duro demais ou bonzinho demais."],
  ),

  // ------------------------------------------------------------ mobilidade geral
  "mob-quadril": d(
    ["Quadril", "Glúteo"],
    [
      "Sente com as duas pernas dobradas a 90 graus, uma à frente e outra ao lado.",
      "Gire os joelhos para o outro lado, mantendo o tronco alto.",
      "Alterne de um lado para o outro devagar.",
    ],
    ["Tronco caído.", "Forçar com as mãos."],
  ),
  "mob-posterior": d(
    ["Posterior de coxa", "Panturrilha"],
    [
      "Caminhando, leve uma perna esticada à frente.",
      "Toque a ponta do pé com a mão oposta.",
      "Alterne as pernas a cada passo.",
    ],
    ["Chutar alto com balanço.", "Arredondar as costas."],
  ),
};
