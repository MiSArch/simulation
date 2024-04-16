import { Shipment } from './entities/shipment.entity';

/**
 * Repository class for storing shipments in memory.
 * It is needed besides the queue to keep track of the shipments for manual updates.
 */
export class ShipmentRepository {
  private shipments: Shipment[] = [];

  /**
   * Creates a new shipment and adds it to the repository.
   * @param shipment - The shipment to be created.
   * @returns The created shipment.
   */
  public create(shipment: Shipment): Shipment {
    this.shipments.push(shipment);
    return shipment;
  }

  /**
   * Finds a shipment by its ID.
   * @param id - The ID of the shipment to find.
   * @returns The found shipment, or undefined if not found.
   */
  public findById(id: string): Shipment | undefined {
    return this.shipments.find((shipment) => shipment.id === id);
  }

  /**
   * Finds all shipments.
   * @returns All shipments.
   */
  public findAll(): Shipment[] {
    return this.shipments;
  }

  /**
   * Updates a shipment with the provided ID.
   * @param id - The ID of the shipment to update.
   * @param update - The partial shipment object with the updated values.
   * @returns The updated shipment, or undefined if the shipment was not found.
   */
  public update(id: string, update: Partial<Shipment>): Shipment | undefined {
    const shipment = this.findById(id);
    if (!shipment) return undefined;
    Object.assign(shipment, update);
    return shipment;
  }

  /**
   * Deletes a shipment with the provided ID.
   * @param id - The ID of the shipment to delete.
   * @returns True if the shipment was successfully deleted, false otherwise.
   */
  public delete(id: string): boolean {
    const initialLength = this.shipments.length;
    this.shipments = this.shipments.filter((shipment) => shipment.id !== id);
    return this.shipments.length < initialLength;
  }
}
