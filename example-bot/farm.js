class Farm {
  animals = [];
  petHistory = [];

  addAnimal(kind, name) {
    let newAnimalName = name;
    if (!newAnimalName) {
      const currentOfKind = this.animals.find(
        (otherAnimal) => otherAnimal.kind === kind
      );
      newAnimalName = `${kind} ${currentOfKind + 1}`;
    }
    this.animals.push({ kind, name: newAnimalName });
  }

  all() {
    return this.animals;
  }

  pet(idUser, name) {
    const animalWithNameExists = Boolean(
      this.animals.find((animal) => animal.name === name)
    );

    if (!animalWithNameExists) {
      throw new Error(`Cannot pet animal ${name}, they're not in the farm`);
    }

    this.petHistory.push({ date: new Date(), idUser, name });
  }

  getPetHistory() {
    return this.petHistory;
  }
}

module.exports.Farm = Farm;
