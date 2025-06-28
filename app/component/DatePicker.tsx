export default function DatePicker(props: any) {
    return (
        <div className="block w-full">
            <label className="block mb-2 capitalize font-bold">{props.label}</label>
            <input
                type="date" // ✅ Change here
                value={props.value || ""}
                name={props.label}
                onChange={props.onChange}
                className={`border rounded py-[.5rem] px-[.8rem] w-full ${props.className}`}
            />
        </div>
    );
}
