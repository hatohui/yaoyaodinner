import 'react-i18next'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: {
        config: { select_language: string }
        quotes: {
          offer_socks: string
        }
        errors: Record<string, string>
        common: {
          rename: string
          edit: string
          done: string
          back: string
          confirm: string
          cancel: string
          save: string
          loading: string
          upload_image: string
          change_image: string
          remove_image: string
          upload_failed: string
          markdown_bold: string
          markdown_italic: string
          markdown_list: string
          markdown_link: string
          crop_image: string
          crop_zoom: string
          crop_confirm: string
          crop_hint: string
          crop_aspect: string
          crop_aspect_original: string
          crop_zoom_in: string
          crop_zoom_out: string
          crop_rotate_left: string
          crop_rotate_right: string
          crop_reset: string
          invalid_file_type: string
          file_too_large: string
          view_image: string
          close: string
        }
        nav: {
          menu: string
          about: string
          dev: string
          tables: string
          feedback: string
          admin: string
          open_menu: string
        }
        access: {
          back: string
          enter_pin: string
          subtitle: string
          unlock: string
          unlocking: string
          invalid_pin: string
          saved_note: string
        }
        tables: {
          no_host: string
          your_table: string
          seats_taken: string
          filter_all: string
          filter_free: string
          filter_full: string
          view_card: string
          view_compact: string
          find_title: string
          search_placeholder: string
          all_tables: string
          full: string
          load_error: string
          none_found: string
        }
        roster: {
          people_here: string
          empty: string
          host: string
          remove: string
          add_placeholder: string
          remove_title: string
          remove_desc: string
          link_copied: string
          share: string
          not_found: string
          add_failed: string
          remove_failed: string
          update_failed: string
          set_host: string
          unset_host: string
          this_is_me: string
          not_me: string
          you: string
          pick_yourself: string
          edit_note: string
          more_actions: string
        }
        menu: {
          restaurant_name: string
          restaurant_en: string
          restaurant_location: string
          search_placeholder: string
          all_categories: string
          no_dishes_title: string
          no_dishes_desc: string
          menu_empty_title: string
          menu_empty_desc: string
          clear_filters: string
          error_title: string
          error_desc: string
          try_again: string
          showing: string
          unavailable: string
          popular: string
          recommended: string
          sort_name: string
          sort_price: string
          sort_price_desc: string
          sort_popular: string
          count_all: string
          select_item: string
          selected_count: string
          clear_selection: string
          add_to_order: string
          configure_title: string
          ordering_for: string
          change_table: string
          adding: string
          choose_table_title: string
          added_to_order: string
          add_failed: string
          pin_required: string
        }
        about: {
          hero_tag: string
          location_title: string
          address_label: string
          address: string
          get_directions: string
          details_tag: string
          details_title: string
          details_body_1: string
          details_body_2: string
          tagline: string
          cta_menu: string
          cta_tables: string
          persona_yaoyao: string
          persona_aster: string
          social_label: string
        }
        food_detail: {
          title: string
          back_to_menu: string
          variants: string
          add_to_order: string
          not_found: string
          description_placeholder: string
        }
        tabs: { people: string; orders: string; splits: string }
        orders: {
          add_order: string
          cart: string
          cart_empty: string
          clear_cart: string
          place_order: string
          placing: string
          placed: string
          place_failed: string
          add: string
          remove_from_cart: string
          increase: string
          decrease: string
          split_as: string
          free: string
          view_cart: string
          needs_people_title: string
          needs_people_body: string
          seat_someone: string
          ordered: string
          view_ordered: string
          back_to_table: string
          ordering_for: string
          in_cart_count: string
          ordered_count: string
          shared: string
          personal: string
          unknown_person: string
          remove: string
          remove_title: string
          remove_desc: string
          empty: string
          total: string
          quantity: string
          update_failed: string
          remove_failed: string
          free_badge: string
        }
        split: {
          people_count: string
          title: string
          just_me: string
          whole_table: string
          choose_people: string
          empty: string
          you: string
          free_badge: string
          your_share: string
          quantity: string
        }
        notes: { title: string; placeholder: string; empty: string }
        feedback: {
          title: string
          name_placeholder: string
          content_placeholder: string
          post: string
          post_failed: string
          anonymous: string
          sort_recent: string
          sort_top: string
          empty: string
        }
        floor_plan: { title: string; view_map: string; empty: string }
        health: Record<string, string>
        dev: Record<string, unknown>
        admin: {
          event: {
            context: string
            viewing_past: string
            action_failed: string
            renamed: string
            pin_rerolled: string
            activated: string
            untitled: string
            pin_label: string
            live: string
            past: string
            name_label: string
            name_placeholder: string
            reroll_pin: string
            make_live: string
            reroll_confirm_title: string
            reroll_confirm_body: string
            activate_confirm_title: string
            activate_confirm_body: string
          }
          edit_mode: {
            label: string
            on: string
          }
          gate: {
            title: string
            subtitle: string
            placeholder: string
            invalid: string
            unlocking: string
            unlock: string
          }
          nav: {
            title: string
            dashboard: string
            exit: string
            lock: string
            toggle: string
            collapse: string
            expand: string
            tables: string
            food: string
            presets: string
            people: string
            stats: string
            feedback: string
            settings: string
          }
          dashboard: {
            title: string
            publish: string
            publishing: string
            publish_title: string
            publish_desc_active: string
            publish_desc_empty: string
            publish_name_placeholder: string
            published: string
            publish_failed: string
            pin_copied: string
            copy_pin: string
            current_event: string
            no_active_event: string
            past_events: string
            past_events_empty: string
            unnamed_event: string
            stat_tables: string
            stat_occupied: string
            stat_people: string
            stat_orders: string
          }
          tables: {
            rename_failed: string
            title: string
            create: string
            create_title: string
            name: string
            name_placeholder: string
            capacity: string
            staged: string
            live: string
            empty: string
            select_all: string
            selected_count: string
            bulk_create: string
            bulk_create_title: string
            bulk_create_desc: string
            count: string
            created: string
            bulk_created: string
            create_failed: string
            deleted: string
            delete_failed: string
            delete_selected: string
            bulk_delete_title: string
            bulk_delete_desc: string
            move_to_staging: string
            moved_to_staging: string
          }
          floor_plan: { drag_hint: string }
          people: {
            title: string
            search_placeholder: string
            empty: string
            name: string
            table: string
            ordered: string
            note: string
            note_placeholder: string
            note_save_failed: string
            update_failed: string
          }
          stats: {
            title: string
            popular_title: string
            popular_empty: string
            scope_event: string
            scope_all: string
            totals_title: string
            totals_empty: string
            outlier: string
          }
          feedback: {
            title: string
            reaction_count: string
          }
          settings: {
            title: string
            subtitle: string
            saved: string
            save_failed: string
            invalid_json: string
            empty: string
            category_auth: string
            category_event: string
            category_tables: string
            category_feedback: string
            category_features: string
          }
        }
      }
    }
  }
}
