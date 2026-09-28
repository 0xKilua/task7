// Au démarrage du serveur : les passages sans vecteur (nouvelle installation du modèle,
// textes livrés mis à jour) sont indexés par le sens en tâche de fond. La condition, écrite
// ainsi, écarte ce code (et son module natif) de la compilation pour l'environnement edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { lancerIndexation } = await import('./lib/semantique');
    void lancerIndexation();
  }
}
