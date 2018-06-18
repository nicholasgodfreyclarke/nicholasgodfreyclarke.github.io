class Team {

    public soldiers: Soldier[] = [];
    public selectedSoldierIndex: number = 0;

    public teamDefeated(): boolean {
        let numAlive = 0;
        for (let soldier of this.soldiers) {
            if (soldier.alive) {
                numAlive++;
            }
        }

        return numAlive === 0;
    }

    public selectedSoldier(): Soldier {
        return this.soldiers[this.selectedSoldierIndex];
    }

    public incrementSelectedSoldierIndex() {

        let soldierFound = false;
        let i = this.selectedSoldierIndex;

        while (!soldierFound) {

            // If at the end of the array -> wrap around.
            if (i === this.soldiers.length - 1) {
                i = 0;
            } else {
                i++;
            }

            soldierFound = this.soldiers[i].alive;
        }

        this.selectedSoldierIndex = i;

    }

}