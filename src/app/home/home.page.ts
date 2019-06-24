import { Component, ViewChild } from '@angular/core';
import { DragulaService } from 'ng2-dragula';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { IonInfiniteScroll } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild(IonInfiniteScroll) infiniteScroll: IonInfiniteScroll;
  items: any = [];
  itemsStorage: any = [];
  item = { value: '', color: '' };
  newItem = [
    { value: '', color: 'primary' }
  ];
  page = 4;

  constructor(
    private dragulaService: DragulaService,
    private toastController: ToastController,
    private storage: Storage
  ) {
    // Load data from localstorage
    this.loadData();
    // Change the background color when you drag some item
    this.dragulaService.drag('bag')
      .subscribe(({ name, el, source }) => {
        el.setAttribute('color', 'danger');
      });
    // Remove a item
    this.dragulaService.removeModel('bag')
      .subscribe(({ item }) => {
        if (item) {
          this.toastController.create({
            message: 'Removed: ' + item.value,
            duration: 2000
          }).then(toast => {
              this.saveData().then(() => {
                this.loadData().then(() => {
                  toast.present();
                });
              });
          });
        }
      });
    // Drop a item
    this.dragulaService.dropModel('bag')
      .subscribe(({ el, target, source, item, sibling, sourceModel, targetModel, sourceIndex, targetIndex }) => {
        this.toastController.create({
          message: 'Item moved: ' + item.value,
          duration: 2000
        }).then(toast => {
          this.saveData().then(() => {
            this.loadData();
          });
          toast.present();
        });
      });
    // Define group rules!
    this.dragulaService.createGroup('bag', {
      // Allow remove when drop and item out of container
      removeOnSpill: true,
      copy: (el, source) => {
        // Copy when a item source is equal to up
        return source.id === 'up';
      },
      copyItem: (item) => {
        this.addItem(item);
      },
      accepts: (el, target, source, sibling) => {
        // To avoid dragging from up to down container
        return target.id === 'down';
      }
    });

  }
  // Counter to know how many characters have
  charCounter(val) {
    if (val) {
      return val.length;
    } else {
      return 0;
    }
  }
  addItem(item) {
    if (this.charCounter(item.value) !== 0 && this.charCounter(item.value) <= 25) {
      if (!this.detectDuplicates(item)) {
        this.items.push({ ...item });
        this.newItem[0] = { value: '', color: 'primary' };
        this.saveData().then(res => {
          this.loadData();
        });
      } else {
        this.toastController.create({
          message: 'Duplicate items are not allowed: ' + item.value,
          duration: 2000
        }).then(toast => toast.present());
      }
    } else {
      this.toastController.create({
        message: 'Description should have less than 25 char and not empty: ' + item.value,
        duration: 2000
      }).then(toast => toast.present());
    }
  }
  // Save the current data in local storage
  async saveData() {
    try {
      await this.storage.set('items', JSON.stringify(this.items));
      console.log('Items save' + JSON.stringify(this.items));
    } catch (error) {
      console.log(error);
    }
  }
  // Load the local storage data to work with updated data.
  async loadData() {
    try {
      await this.storage.get('items').then(val => {
        if (val != null && val !== undefined) {
          this.items = JSON.parse(val);
          console.log(this.items);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }
  // Clear local storage and this.items
  clearData() {
    this.items = [];
    try {
      this.storage.clear();
    } catch (error) {
      console.log(error);
    }
  }
  // Flag to change state beetwen editable and readonly item.
  setEditable(item) {
    if (item.editable) {
      item.editable = false;
      item.color = 'primary';
    } else {
      item.editable = true;
      item.color = 'success';
    }
  }
  // Detect duplicates
  detectDuplicates(check) {
    for (const item of this.items) {
      if (item.value === check.value) {
        return true;
      }
      return false;
    }
  }
  // load infinit scroll data
  infinitScrolData(event) {
    setTimeout(() => {
      console.log(event);
      this.page += 4;
      event.target.complete();
      // App logic to determine if all data is loaded
      // and disable the infinite scroll
      if (this.items.length === this.page) {
        event.target.disabled = true;
      }
    }, 200);
  }
}
