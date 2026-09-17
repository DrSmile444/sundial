const fieldClasses =
  'w-full rounded-card border border-sand bg-white px-4 py-3 text-sm text-ink outline-none focus:border-teal';

const labelClasses = 'text-xs font-medium uppercase tracking-wide text-ink/60';

export function StaySearchForm() {
  return (
    <form
      action="/rooms"
      method="get"
      className="grid w-full grid-cols-1 gap-4 rounded-card border border-sand bg-white/70 p-6 shadow-sm sm:grid-cols-4 sm:items-end"
    >
      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="search-check-in">
          Check in
        </label>
        <input
          id="search-check-in"
          name="checkIn"
          type="date"
          defaultValue=""
          className={fieldClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="search-check-out">
          Check out
        </label>
        <input
          id="search-check-out"
          name="checkOut"
          type="date"
          defaultValue=""
          className={fieldClasses}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelClasses} htmlFor="search-guests">
          Guests
        </label>
        <select id="search-guests" name="guests" defaultValue="" className={fieldClasses}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5, 6].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-card bg-burnt px-6 py-3 font-body text-sm font-medium text-ground transition-colors hover:bg-mustard"
      >
        Search rooms
      </button>
    </form>
  );
}
