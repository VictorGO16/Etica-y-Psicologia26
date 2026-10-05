// La matriz diaria siempre evalúa los tres módulos de cada fecha incluida.
// El filtro de módulo afecta al detalle, no altera la asistencia completa del día.
export function attendanceMatrix(students,sessions,records){
  const dates=[...new Set(sessions.map(s=>s.date))].sort().reverse();
  const present=new Set(records.map(r=>`${r.date}:${r.studentId}:${r.module}`));
  return dates.flatMap(date=>students.map(student=>{
    const row={date,name:student.name};
    for(const module of [1,2,3])row[`M${module}`]=present.has(`${date}:${student.id}:${module}`)?1:0;
    row.asistencia_completa=row.M1+row.M2+row.M3>=2?1:0;
    return row;
  }));
}
